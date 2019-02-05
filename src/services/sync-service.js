const BaseService = require('./base-service')

const utils = require('plasma-utils')
const SignedTransaction = utils.serialization.models.SignedTransaction

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const defaultOptions = {
  transactionPollInterval: 15000
}

/**
 * Handles automatically synchronizing latest history proofs.
 */
class SyncService extends BaseService {
  constructor (options) {
    super(options, defaultOptions)
    this.pending = []
  }

  get name () {
    return 'sync'
  }

  async start () {
    this.started = true

    this.services.contract.on('event:Deposit', this._onDeposit.bind(this))
    this.services.contract.on('event:BlockSubmitted', this._onBlockSubmitted.bind(this))
    this.services.contract.on('event:ExitStarted', this._onExitStarted.bind(this))
    this.services.contract.on('event:ExitFinalized', this._onExitFinalized.bind(this))

    this._pollPendingTransactions()
  }

  async stop () {
    this.started = false

    this.removeAllListeners()
  }

  /**
   * Wrapper that handles regularly polling pending transactions.
   */
  async _pollPendingTransactions () {
    if (!this.started) return

    try {
      await this._checkPendingTransactions()
    } finally {
      await utils.utils.sleep(this.options.transactionPollInterval)
      this._pollPendingTransactions()
    }
  }

  /**
   * Checks for any available pending transactions and emits an event for each.
   */
  async _checkPendingTransactions () {
    if (
      !this.services.operator.online ||
      !this.services.contract.contract ||
      !this.services.contract.contract.options.address
    ) { return }

    const lastSyncedBlock = await this.services.db.get(`sync:block`, -1)
    const firstUnsyncedBlock = lastSyncedBlock + 1
    const currentBlock = await this.services.chain.getLatestBlock()
    if (firstUnsyncedBlock > currentBlock) return
    this.logger(
      `Checking for new transactions between blocks ${firstUnsyncedBlock} and ${currentBlock}`
    )

    // TODO: Figure out how handle operator errors.
    const addresses = await this.services.wallet.getAccounts()
    for (let address of addresses) {
      this.pending = this.pending.concat(
        await this.services.operator.getTransactions(
          address,
          firstUnsyncedBlock,
          currentBlock
        )
      )
    }

    // Add any previously failed transactions to try again.
    const prevFailed = await this.services.db.get(`sync:failed`, [])
    this.pending = this.pending.concat(prevFailed)

    // Remove any duplicates
    this.pending = [...new Set(this.pending)]

    let failed = []
    for (let i = 0; i < this.pending.length; i++) {
      const encoded = this.pending[i]
      const tx = new SignedTransaction(encoded)
      try {
        await this.addTransaction(tx)
      } catch (err) {
        failed.push(encoded)
        this.logger(`ERROR: ${err}`)
        this.logger(`Ran into an error while importing transaction: ${tx.hash}, trying again in a few seconds...`)
      }
    }

    await this.services.db.set(`sync:failed`, failed)
    await this.services.db.set(`sync:block`, currentBlock)
  }

  /**
   * Tries to add any newly received transactions.
   * @param {*} encoded An encoded transaction.
   */
  async addTransaction (tx) {
    // TODO: The operator should really be avoiding this.
    if (tx.transfers[0].sender === NULL_ADDRESS) {
      return
    }

    if (await this.services.chain.hasTransaction(tx.hash)) {
      return
    }

    this.logger(`Detected new transaction: ${tx.hash}`)
    this.logger(`Attemping to pull information for transaction: ${tx.hash}`)
    let txInfo
    try {
      txInfo = await this.services.operator.getTransaction(tx.encoded)
    } catch (err) {
      this.logger(`ERROR: Operator failed to return information for transaction: ${tx.hash}`)
      throw err
    }

    this.logger(`Importing new transaction: ${tx.hash}`)
    await this.services.chain.addTransaction(txInfo.transaction, txInfo.deposits, txInfo.proof)
    this.logger(`Successfully imported transaction: ${tx.hash}`)
  }

  // TODO: What to do if any of these fail?
  async _onDeposit (deposits) {
    for (let deposit of deposits) {
      await this.services.chain.addDeposit(deposit)
    }
  }

  async _onBlockSubmitted (blocks) {
    await this.services.chain.addBlockHeaders(blocks)
  }

  async _onExitFinalized (exits) {
    for (let exit of exits) {
      await this.services.chain.markFinalized(exit)
      await this.services.chain.addExitableEnd(exit.token, exit.start)
    }
  }

  async _onExitStarted (exits) {
    for (let exit of exits) {
      try {
        await this.services.rangeManager.removeRange(exit.exiter, exit)
      } catch (err) {
      } finally {
        await this.services.chain.addExit(exit)
      }
    }
  }
}

module.exports = SyncService
