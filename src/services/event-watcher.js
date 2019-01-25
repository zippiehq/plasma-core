const BaseService = require('./base-service')

const defaultOptions = {
  finalityDepth: 12
}

class EventWatcher extends BaseService {
  constructor (options) {
    super(options, defaultOptions)
    this.events = {}
    this.subscriptions = {}
    this.watching = false
  }

  get name () {
    return 'eventWatcher'
  }

  async start () {
    this.started = true
  }

  async stop () {
    this.started = false
    this._stopWatchingEvents()
  }

  subscribe (event, listener) {
    if (!this.watching) {
      this.watching = true
      this._startWatchingEvents()
    }
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

  async _startWatchingEvents () {
    this._stopWatchingEvents()
    this.watchIntervalRef = setInterval(async () => {
      if (!this.started) {
        await this._stopWatchingEvents()
        return
      }
      if (!this.app.services.web3.started) {
        return
      }

      const block = await this.services.web3.eth.getBlockNumber()
      const lastFinalBlock = block - this.options.finalityDepth

      for (let event in this.events) {
        if (!this.events[event].active) {
          continue
        }

        let lastLoggedBLock = await this.services.db.get(
          `lastlogged:${event}`,
          -1
        )
        if (lastLoggedBLock + 1 > lastFinalBlock) return

        this.services.contract.contract.getPastEvents(
          event,
          {
            fromBlock: lastLoggedBLock + 1,
            toBlock: lastFinalBlock
          },
          (err, events) => {
            if (err) {
              throw err
            }

            this.subscriptions[event].forEach((listener) => {
              events.forEach((e) => {
                listener(e)
              })
            })
            this.services.db.set(`lastlogged:${event}`, lastFinalBlock)
          }
        )
      }
    }, 100) // TODO: How often should this ping?
  }

  _stopWatchingEvents () {
    if (this.watchIntervalRef) {
      clearInterval(this.watchIntervalRef)
    }
  }
}

module.exports = EventWatcher
