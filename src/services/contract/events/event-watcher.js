const utils = require('plasma-utils')
const BaseService = require('../../base-service')

const defaultOptions = {
  finalityDepth: 12,
  eventPollInterval: 15000
}

/**
 * Service for watching Ethereum events.
 */
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

  /**
   * Subscribes to an event with a given callback.
   * @param {string} event Name of the event to subscribe to.
   * @param {Function} listener Function to be called when the event is triggered.
   */
  subscribe (event, listener) {
    this.startPolling()
    if (!(event in this.events)) {
      this.events[event] = { active: true }
      this.subscriptions[event] = []
    }
    this.subscriptions[event].push(listener)
  }

  /**
   * Unsubscribes from an event with a given callback.
   * @param {string} event Name of the event to unsubscribe from.
   * @param {Function} listener Function that was used to subscribe.
   */
  unsubscribe (event, listener) {
    this.subscriptions[event] = this.subscriptions[event].filter((l) => {
      return l !== listener
    })
    if (this.subscriptions[event].length === 0) {
      this.events[event].active = false
    }
  }

  /**
   * Starts the polling loop.
   * Can only be called once.
   */
  startPolling () {
    if (this.watching) return
    this.watching = true
    this._pollEvents()
  }

  /**
   * Polling loop.
   * Checks events then sleeps before calling itself again.
   * Stops polling if the service is stopped.
   */
  async _pollEvents () {
    if (!this.started) {
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

  /**
   * Checks for new events and triggers any listeners on those events.
   * Will only check for events that are currently being listened to.
   */
  async _checkEvents () {
    const connected = await this.services.web3.connected()
    if (!connected) {
      this.logger(`ERROR: Could not connect to Ethereum`)
      return
    }

    const block = await this.services.web3.eth.getBlockNumber()
    let lastFinalBlock = block - this.options.finalityDepth
    lastFinalBlock = lastFinalBlock < 0 ? 0 : lastFinalBlock

    await Promise.all(
      Object.keys(this.events).map((eventName) =>
        this._checkEvent(eventName, lastFinalBlock)
      )
    )
  }

  /**
   * Checks for new instances of an event.
   * @param {string} eventName Name of the event.
   * @param {number} lastFinalBlock Number of the latest block known to be final.
   */
  async _checkEvent (eventName, lastFinalBlock) {
    if (!this.events[eventName].active || !this.services.contract.hasAddress) {
      return
    }

    let lastLoggedBLock = await this.services.db.get(
      `lastlogged:${eventName}`,
      -1
    )
    let firstUnsyncedBlock = lastLoggedBLock + 1
    if (firstUnsyncedBlock > lastFinalBlock) return
    this.logger(
      `Checking for new ${eventName} events between Ethereum blocks ${firstUnsyncedBlock} and ${lastFinalBlock}`
    )

    let events = await this.services.contract.contract.getPastEvents(
      eventName,
      {
        fromBlock: firstUnsyncedBlock,
        toBlock: lastFinalBlock
      }
    )

    // Filter out events that we've already seen.
    events.forEach((event) => {
      event.hash = this._getEventHash(event)
    })
    const isUnique = await Promise.all(
      events.map(async (event) => {
        return !(await this.services.db.exists(`event:${event.hash}`))
      })
    )
    events = events.filter((_, i) => isUnique[i])

    if (events.length > 0) {
      // Mark these events as seen.
      const objects = events.map((event) => {
        return {
          key: `event:${event.hash}`,
          value: true
        }
      })
      await this.services.db.bulkPut(objects)

      // Alert any listeners.
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

  _getEventHash ({ transactionHash, logIndex }) {
    return this.services.web3.utils.sha3(transactionHash + logIndex)
  }

  /**
   * Resets the watcher.
   */
  _reset () {
    this.watching = false
    this.subscriptions = {}
    this.events = {}
  }
}

module.exports = EventWatcher
