const BaseService = require('./base-service')

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
