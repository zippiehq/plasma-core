const BaseService = require('./base-service')

/**
 * Watches for invalid exits and automatically starts challenges.
 */
class GuardService extends BaseService {
  get name () {
    return 'guard'
  }

  get dependencies () {
    return ['eventHandler']
  }

  async start () {
    this.started = true
    this.services.eventHandler.on(
      'event:ExitStarted',
      this._onExitStarted.bind(this)
    )
  }

  async stop () {
    this.started = false
  }

  /**
   * Handles an ExitStartedEvent event and starts a challenge if the exit is invalid.
   * @param {ExitStartedEvent} event ExitStartedEvent event to be handled.
   */
  _onExitStarted (event) {
    // TODO: Check if the token being exited belongs to the user.
    // TODO: Submit a challenge if someone is trying to steal the user's funds.
    // TODO: Figure out what type of challenge needs to be submitted.
    throw new Error('Not implemented')
  }
}

module.exports = GuardService
