const BaseService = require('./base-service')

/**
 * Handles automatically synchronizing latest history proofs.
 */
class SyncService extends BaseService {
  constructor (options) {
    super()
    this.app = options.app
  }

  get name () {
    return 'sync-service'
  }

  async start () {
    // TODO: What happens if the client comes online later and needs to catch up?
    // TODO: Hmmm... maybe want a layer of abstraction here instead of watching events directly?
    this.app.ethService.on('event:BlockCreated', this._onBlockCreated)
  }

  async stop () {
    this.app.ethService.off('event:BlockCreated', this._onBlockCreated)
  }

  _onBlockCreated (event) {
    // TODO: Figure out what ranges need to be queried
    // TODO: Pull all transactions for those ranges in that block.
    // TODO: Stuff them in the chain service.
  }
}

module.exports = SyncService
