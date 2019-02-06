const BaseService = require('../../base-service')
const models = require('./event-models')

/**
 * Cleans up events received through EventWatcher.
 */
class EventHandler extends BaseService {
  get name () {
    return 'eventHandler'
  }

  get dependencies () {
    return ['eventWatcher']
  }

  async _onStart () {
    this._registerHandlers()
  }

  async _onStop () {
    this.removeAllListeners()
  }

  /**
   * Emits a prefixed event.
   * @param {string} name Name of the event.
   * @param {*} event Event object.
   */
  _emitContractEvent (name, event) {
    this.emit(`event:${name}`, event)
  }

  /**
   * Registers event handlers.
   */
  _registerHandlers () {
    const handlers = {
      DepositEvent: this._onDeposit,
      SubmitBlockEvent: this._onBlockSubmitted,
      BeginExitEvent: this._onExitStarted,
      FinalizeExitEvent: this._onExitFinalized
    }
    for (let eventName in handlers) {
      this.services.eventWatcher.subscribe(
        eventName,
        handlers[eventName].bind(this)
      )
    }
  }

  /**
   * Handles Deposit events.
   * @param {EthereumEvent} events Deposit events.
   */
  _onDeposit (events) {
    const deposits = events.map((event) => {
      return new models.DepositEvent(event)
    })
    deposits.forEach((deposit) => {
      this.logger(
        `Detected new deposit of ${deposit.amount} [${deposit.token}] for ${
          deposit.owner
        }`
      )
    })
    this._emitContractEvent('Deposit', deposits)
  }

  /**
   * Handles BlockSubmitted events.
   * @param {EthereumEvent} events BlockSubmitted events.
   */
  _onBlockSubmitted (events) {
    const blocks = events.map((event) => {
      return new models.BlockSubmittedEvent(event)
    })
    blocks.forEach((block) => {
      this.logger(`Detected block #${block.number}: ${block.hash}`)
    })
    this._emitContractEvent('BlockSubmitted', blocks)
  }

  /**
   * Handles ExitStarted events.
   * @param {EthereumEvent} events ExitStarted events.
   */
  _onExitStarted (events) {
    const exits = events.map((event) => {
      return new models.ExitStartedEvent(event)
    })
    exits.forEach((exit) => {
      this.logger(`Detected new started exit: ${exit.id}`)
    })
    this._emitContractEvent('ExitStarted', exits)
  }

  /**
   * Handles ExitFinalized events.
   * @param {EthereumEvent} events ExitFinalized events.
   */
  _onExitFinalized (events) {
    const exits = events.map((event) => {
      return new models.ExitFinalizedEvent(event)
    })
    exits.forEach((exit) => {
      this.logger(`Detected new finalized exit: ${exit.id}`)
    })
    this._emitContractEvent('ExitFinalized', exits)
  }
}

module.exports = EventHandler
