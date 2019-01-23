const BaseService = require('./base-service')

const utils = require('plasma-utils')
const UnsignedTransaction = utils.serialization.models.UnsignedTransaction

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

    this.services.contract.on('event:Deposit', this._onDeposit.bind(this))
    this.on('TransactionReceived', this._onTransactionReceived.bind(this))

    this._pollPendingTransactions()
  }

  async stop () {
    this.started = false

    this.removeAllListeners()
    this._stopPollingPendingTransactions()
  }

  /**
   * Regularly watch for new transactions.
   * Starts an interval that can be stopped later.
   */
  _pollPendingTransactions () {
    // Stop polling to prevent duplicate listeners,
    this._stopPollingPendingTransactions()

    this.pollRef = setInterval(async () => {
      const lastSyncedBlock = await this.services.db.get(`sync:block`, -1)
      // TODO: Should this be determined locally? Also, should we store blocks locally?
      const currentBlock = await this.services.contract.getCurrentBlock()

      let pending = []
      const addresses = await this.services.wallet.getAccounts()
      for (let address of addresses) {
        pending = pending.concat(
          await this.services.operator.getTransactions(
            address,
            lastSyncedBlock + 1,
            currentBlock
          )
        )
      }

      pending.forEach((transaction) => {
        this.emit('TransactionReceived', {
          transaction: transaction
        })
      })

      await this.services.db.set(`sync:block`, currentBlock)
    }, this.pollInterval)
  }

  /**
   * Stops watching for new transactions.
   */
  _stopPollingPendingTransactions () {
    if (this.pollRef) {
      clearInterval(this.pollRef)
    }
  }

  /**
   * Tries to add any newly received transactions.
   * @param {*} event A TransactionReceived event.
   */
  async _onTransactionReceived (event) {
    const serializedTx = new UnsignedTransaction(event.transaction)
    if (await this.services.chain.hasTransaction(serializedTx.hash)) {
      return
    }

    const {
      transaction,
      deposits,
      proof
    } = await this.services.operator.getTransaction(serializedTx.encoded)
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
}

module.exports = SyncService
