const Web3 = require('web3')
const BaseService = require('./base-service')
const utils = require('plasma-utils')

class Web3Provider extends BaseService {
  async start () {
    this.started = true
    this.web3 = new Web3(this._getProvider())
    Object.assign(this, this.web3) // A bit of a hack, maybe there's a nicer way to expose this?
  }

  async stop () {
    this.started = false
    if (this.provider) {
      this.provider.removeAllListeners()
    }
  }

  get name () {
    return 'web3'
  }

  _getProvider () {
    if (!this.started) return
    if (this.provider) {
      this.provider.removeAllListeners()
    }

    let provider = new Web3.providers.WebsocketProvider('ws://localhost:8545')
    provider.on('error', async () => {
      this.app.logger.log('WebSocket error, attempting to reconnect...')
      await utils.utils.sleep(100)
      this.web3.setProvider(this._getProvider())
    })
    provider.on('end', async () => {
      this.app.logger.log('WebSocket disconnected, attempting to reconnect...')
      await utils.utils.sleep(100)
      this.web3.setProvider(this._getProvider())
    })
    provider.on('connect', () => {
      this.app.logger.log('WebSocket connection established.')
    })
    this.provider = provider
    return provider
  }
}

module.exports = Web3Provider
