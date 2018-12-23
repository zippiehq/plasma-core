const BaseService = require('./base-service')

class SyncService extends BaseService {
  constructor (options) {
    super()
  }

  get name () {
    return 'sync-service'
  }
}

module.exports = SyncService
