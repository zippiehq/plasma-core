const BaseService = require('./base-service')

/**
 * Watches for invalid exits and automatically starts challenges.
 */
class GuardService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  get name () {
    return 'guard-service'
  }

  /**
   * Handles an ExitStarted event and starts a challenge if the exit is invalid.
   * @param {*} event ExitStarted event to be handled.
   */
  handleExitStarted (event) {
    // TODO: Check if the token being exited belongs to the user.
    // TODO: Submit a challenge if someone is trying to steal the user's funds.
    // TODO: Figure out what type of challenge needs to be submitted.
    throw new Error('Not implemented')
  }

  async start () {
    this.app.services.eth.on('event:ExitStarted', this.handleExitStarted)
  }

  async stop () {
    this.app.services.eth.off('event:ExitStarted', this.handleExitStarted)
  }
}

module.exports = GuardService
