const BaseService = require('./base-service')

/**
 * Handles automatically synchronizing latest history proofs.
 */
class SyncService extends BaseService {
  get name () {
    return 'sync'
  }

  async start () {
    // TODO: What happens if the client comes online later and needs to catch up?
    // TODO: Hmmm... maybe want a layer of abstraction here instead of watching events directly?
    this.services.eth.on('event:BlockCreated', this._onBlockCreated)
  }

  async stop () {
    this.services.eth.off('event:BlockCreated', this._onBlockCreated)
  }

  async _onBlockCreated (event) {
    await this.services.chain.addBlockHeader(event.number, event.hash)

    // TODO: Figure out what to do if the operator tries to cheat.
    const ranges = await this.services.chain.getOwnedRanges()
    for (let range of ranges) {
      let transaction = await this.services.operator.getTransaction(
        range,
        event.number
      )
      await this.services.chain.addTransaction(transaction)
    }
  }
}

module.exports = SyncService
