const BaseService = require('./base-service')

const utils = require('plasma-utils')
const Transaction = utils.serialization.models.Transaction

/**
 * Handles automatically synchronizing latest history proofs.
 */
class SyncService extends BaseService {
  constructor (options) {
    super(options)
    this.pollInterval = 1000
  }

  get name () {
    return 'sync'
  }

  async start () {
    this.started = true

    // TODO: What happens if the client comes online later and needs to catch up?
    // TODO: Hmmm... maybe want a layer of abstraction here instead of watching events directly?
    this.services.eth.contract.on(
      'event:BlockSubmitted',
      this._onBlockSubmitted.bind(this)
    )
    this.on('TransactionReceived', this._onTransactionReceived.bind(this))

    this._pollPendingTransactions()
  }

  async stop () {
    this.services.eth.contract.removeListener(
      'event:BlockSubmitted',
      this._onBlockSubmitted.bind(this)
    )
    this.removeListener(
      'TransactionReceived',
      this._onTransactionReceived.bind(this)
    )

    this._stopPollingPendingTransactions()
  }

  _pollPendingTransactions () {
    // Stop polling to prevent duplicate listeners,
    this._stopPollingPendingTransactions()

    this.pollRef = setInterval(async () => {
      // TODO: Support importing transactions for multiple accounts.
      const addresses = await this.services.wallet.getAccounts()
      const address = addresses[0]

      const lastSyncedBlock = await this.services.db.get(`sync:block`, -1)
      // TODO: Should this be determined locally?
      const currentBlock = await this.services.eth.contract.getCurrentBlock()

      const pending = await this.services.operator.getTransactions(
        address,
        lastSyncedBlock + 1,
        currentBlock
      )

      pending.forEach((transaction) => {
        this.emit('TransactionReceived', {
          transaction: transaction
        })
      })

      await this.services.db.set(`sync.block`, currentBlock)
    }, this.pollInterval)
  }

  _stopPollingPendingTransactions () {
    if (this.pollRef) {
      clearInterval(this.pollRef)
    }
  }

  async _onTransactionReceived (event) {
    const serializedTx = new Transaction(event.transaction)
    if (!(await this.services.chain.hasTransaction(serializedTx.hash))) {
      return
    }

    const {
      transaction,
      deposits,
      proof
    } = await this.services.operator.getTransaction(event.transaction)
    await this.services.chain.addTransaction(transaction, deposits, proof)
  }

  // TODO: Figure out if this is necessary at all.
  async _onBlockSubmitted (event) {
    await this.services.chain.addBlockHeader(event.number, event.hash)
  }
}

module.exports = SyncService
