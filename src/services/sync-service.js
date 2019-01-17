const BaseService = require('./base-service')

/**
 * Handles automatically synchronizing latest history proofs.
 */
class SyncService extends BaseService {
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
    this._stopPollingPendingTransactions()

    this.pollRef = setInterval(async () => {
      const addresses = await this.services.wallet.getAccounts()
      const address = addresses[0]
      const pending = await this.services.operator.getPendingTransactions(
        address
      )
      pending.forEach((hash) => {
        this.emit('TransactionReceived', {
          hash: hash
        })
      })
    }, 1000)
  }

  _stopPollingPendingTransactions () {
    if (this.pollRef) {
      clearInterval(this.pollRef)
    }
  }

  async _onTransactionReceived (event) {
    const hasTransaction = await this.services.chain.hasTransaction(event.hash)
    if (hasTransaction) {
      return
    }

    const transaction = await this.services.operator.getTransaction(event.hash)
    await this.services.chain.addTransaction(transaction)
  }

  async _onBlockSubmitted (event) {
    await this.services.chain.addBlockHeader(event.number, event.hash)

    // TODO: Figure out what to do if the operator tries to cheat.
    /*
    const ranges = await this.services.chain.getOwnedRanges()
    for (let range of ranges) {
      let transaction = await this.services.operator.getTransaction(
        range,
        event.number
      )
      await this.services.chain.addTransaction(transaction)
    }
    */
  }
}

module.exports = SyncService
