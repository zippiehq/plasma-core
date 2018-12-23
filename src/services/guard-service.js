const BaseService = require('./base-service')

class GuardService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  get name () {
    return 'guard-service'
  }

  async start () {
    throw new Error('Not implemented')
  }

  async stop () {
    throw new Error('Not implemented')
  }
}

module.exports = GuardService
