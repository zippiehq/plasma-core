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
  }

  get name () {
    return 'sync'
  }

  async start () {
    this.started = true

    this.services.contract.on('event:Deposit', this._onDeposit.bind(this))

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
      await utils.utils.sleep(100)
      this._pollPendingTransactions()
    }
  }

  /**
   * Checks for any available pending transactions and emits an event for each.
   */
  async _checkPendingTransactions () {
    if (
      !this.services.contract.contract ||
      !this.services.contract.contract.options.address
    ) { return }

    const lastSyncedBlock = await this.services.db.get(`sync:block`, -1)
    const firstUnsyncedBlock = lastSyncedBlock + 1
    // TODO: Should this be determined locally? Also, should we store blocks locally?
    const currentBlock = await this.services.contract.getCurrentBlock()
    if (firstUnsyncedBlock > currentBlock) return
    this.logger(
      `Checking for new transactions between blocks ${firstUnsyncedBlock} and ${currentBlock}`
    )

    // TODO: Figure out how handle operator errors.
    let pending = []
    const addresses = await this.services.wallet.getAccounts()
    for (let address of addresses) {
      pending = pending.concat(
        await this.services.operator.getTransactions(
          address,
          firstUnsyncedBlock,
          currentBlock
        )
      )
    }

    for (let encoded of pending) {
      try {
        await this.addTransaction(encoded)
      } catch (err) {
        console.log(err)
      }
    }

    await this.services.db.set(`sync:block`, currentBlock)
  }

  /**
   * Tries to add any newly received transactions.
   * @param {*} encoded An encoded transaction.
   */
  async addTransaction (encoded) {
    const tx = new SignedTransaction(encoded)

    // TODO: The operator should really be avoiding this.
    if (tx.transfers[0].sender === NULL_ADDRESS) {
      return
    }

    if (await this.services.chain.hasTransaction(tx.hash)) {
      return
    }

    const {
      transaction,
      deposits,
      proof
    } = await this.services.operator.getTransaction(tx.encoded)
    this.logger(`Importing new transaction: ${tx.hash}`)
    await this.services.chain.addTransaction(transaction, deposits, proof)
  }

  /**
   * Handles adding new deposits for the user.
   * @param {*} event A Deposit event.
   */
  async _onDeposit (event) {
    // TODO: Where should address filtering be done?
    // Probably wherever events are originally watched to reduce total events pulled.
    await this.services.chain.addDeposit(event)
  }

  async _onBlockSubmitted (event) {
    await this.services.chain.addBlockHeader(event.block, event.hash)
  }
}

module.exports = SyncService
