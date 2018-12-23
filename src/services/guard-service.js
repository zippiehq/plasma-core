const BaseService = require('./base-service')

class GuardService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  get name () {
    return 'guard-service'
  }

  start () {
    throw new Error('Not implemented')
  }

  stop () {
    throw new Error('Not implemented')
  }
}

module.exports = GuardService
