const BaseService = require('./base-service')

class GuardService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  get name () {
    return 'guard-service'
  }

  handleEvent (event) {
    // TODO: Check if the token being exited belongs to the user.
    // TODO: Submit a challenge if someone is trying to steal the user's funds.
    // TODO: Figure out what type of challenge needs to be submitted.
    throw new Error('Not implemented')
  }

  async start () {
    this.app.services.eth.on('event:ExitStarted', this.handleEvent)
  }

  async stop () {
    this.app.services.eth.off('event:ExitStarted', this.handleEvent)
  }
}

module.exports = GuardService
