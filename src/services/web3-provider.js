const Web3 = require('web3')
const BaseService = require('./base-service')

const defaultOptions = {
  ethereumEndpoint: 'http://localhost:8545'
}

class Web3Provider extends BaseService {
  constructor (options) {
    super(options, defaultOptions)
  }

  get name () {
    return 'web3'
  }

  async start () {
    this.started = true
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(this.options.ethereumEndpoint)
    )
    // A bit of a hack, maybe there's a nicer way to expose this?
    Object.assign(this, this.web3)
  }

  async stop () {
    this.started = false
    if (this.provider) {
      this.provider.removeAllListeners()
    }
  }

  /**
   * Whether or not the provider is connected.
   * @return {boolean} `true` if connected, `false` otherwise.
   */
  get connected () {
    return this.web3.currentProvider.connected
  }
}

module.exports = Web3Provider
