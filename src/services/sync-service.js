const BaseService = require('./base-service')

/**
 * Handles automatically synchronizing latest history proofs.
 */
class SyncService extends BaseService {
  constructor (options) {
    super()
  }

  get name () {
    return 'sync-service'
  }

  async start () {
    throw new Error('Not implemented')
  }

  async stop () {
    throw new Error('Not implemented')
  }
}

module.exports = SyncService
