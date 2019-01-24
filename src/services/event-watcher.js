const utils = require('plasma-utils')
const BaseService = require('./base-service')

const defaultOptions = {
  finalityDepth: 12
}

class EventWatcher extends BaseService {
  constructor (options) {
    super(options, defaultOptions)
    this.events = {}
    this.subscriptions = {}
  }

  get name () {
    return 'eventWatcher'
  }

  async start () {
    this.started = true
    this._reset()
    this.services.web3._provider.on('error', async () => {
      await this._reset()
    })
    this.services.web3._provider.on('end', async () => {
      await this._reset()
    })
  }

  async stop () {
    this.started = false
    await this._stopWatchingEvents()
  }

  subscribe (event, listener) {
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

  _startWatchingEvents () {
    this.ethSubscription = this.services.web3.eth.subscribe(
      'newBlockHeaders',
      async (err, block) => {
        if (err) {
          throw err
        }
        const lastFinalBlock = block.number - this.options.finalityDepth

        for (let event in this.events) {
          if (!this.events[event].active) {
            continue
          }
          let lastLoggedBLock = await this.services.db.get(
            `lastlogged:${event}`,
            0
          )

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
              this.services.db.set(`lastlogged:${event}`, lastLoggedBLock)
            }
          )
        }
      }
    )
  }

  _stopWatchingEvents () {
    return new Promise((resolve) => {
      if (this.ethSubscription) {
        this.ethSubscription.unsubscribe((err, res) => {
          if (err) {
            throw err
          }
          this.ethSubscription = null
          resolve()
        })
      }
    })
  }

  async _reset () {
    if (!this.app.services.web3.started) return

    if (this.services.web3._provider.connected) {
      this._startWatchingEvents()
    } else {
      await utils.utils.sleep(1000)
      await this._reset()
    }
  }
}

module.exports = EventWatcher
