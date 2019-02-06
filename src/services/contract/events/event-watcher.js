const utils = require('plasma-utils')
const BaseService = require('../../base-service')

const defaultOptions = {
  finalityDepth: 12,
  eventPollInterval: 15000
}

class EventWatcher extends BaseService {
  constructor (options) {
    super(options, defaultOptions)
  }

  get name () {
    return 'eventWatcher'
  }

  get dependencies () {
    return ['contract', 'web3', 'db']
  }

  async _onStart () {
    this._reset()
  }

  async _onStop () {
    this._reset()
  }

  subscribe (event, listener) {
    this._startPolling()
    if (!(event in this.events)) {
      this.events[event] = { active: true }
      this.subscriptions[event] = []
    }
    this.subscriptions[event].push(listener)
  }

  unsubscribe (event, listener) {
    this.subscriptions[event] = this.subscriptions[event].filter((l) => {
      return l !== listener
    })
    if (this.subscriptions[event].length === 0) {
      this.events[event].active = false
    }
  }

  async _startPolling () {
    if (this.watching) return
    this.watching = true
    this._pollEvents()
  }

  async _pollEvents () {
    if (!this.healthy) {
      this.logger(`ERROR: Stopped watching for events`)
      return
    }

    try {
      await this._checkEvents()
    } finally {
      await utils.utils.sleep(this.options.eventPollInterval)
      this._pollEvents()
    }
  }

  // TODO: Remove any events that have already been seen.
  async _checkEvents () {
    const connected = await this.services.web3.connected()
    if (!connected) {
      this.logger(`ERROR: Could not connect to Ethereum`)
      return
    }

    const block = await this.services.web3.eth.getBlockNumber()
    let lastFinalBlock = block - this.options.finalityDepth
    lastFinalBlock = lastFinalBlock < 0 ? 0 : lastFinalBlock

    for (let eventName in this.events) {
      if (
        !this.events[eventName].active ||
        !this.services.contract.hasAddress
      ) {
        continue
      }

      let lastLoggedBLock = await this.services.db.get(
        `lastlogged:${eventName}`,
        -1
      )
      let firstUnsyncedBlock = lastLoggedBLock + 1
      if (firstUnsyncedBlock > lastFinalBlock) return
      this.logger(
        `Checking for new ${eventName} events between blocks ${firstUnsyncedBlock} and ${lastFinalBlock}`
      )

      let events = await this.services.contract.contract.getPastEvents(
        eventName,
        {
          fromBlock: firstUnsyncedBlock,
          toBlock: lastFinalBlock
        }
      )

      if (events.length > 0) {
        for (let listener of this.subscriptions[eventName]) {
          try {
            listener(events)
          } catch (err) {
            console.log(err) // TODO: Handle this.
          }
        }
      }

      await this.services.db.set(`lastlogged:${eventName}`, lastFinalBlock)
    }
  }

  _reset () {
    this.watching = false
    this.subscriptions = {}
    this.events = {}
  }
}

module.exports = EventWatcher
