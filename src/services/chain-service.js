const BaseService = require('./base-service')
const Chain = require('../chain')

class ChainService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
    this.db = this.app.services.db
    this.chain = new Chain(this.db)
  }

  isSyncing () {
    throw Error('Not implemented')
  }
}

module.exports = ChainService
