const BaseService = require('./base-service')

class GuardService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  start () {
    throw Error('Not implemented')
  }

  stop () {
    throw Error('Not implemented')
  }
}

module.exports = GuardService
