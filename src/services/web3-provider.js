const Web3 = require('web3')
const BaseService = require('./base-service')

class Web3Provider extends BaseService {
  async start () {
    this.started = true
    this.web3 = new Web3(
      new Web3.providers.HttpProvider('http://localhost:8545')
    )
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
}

module.exports = Web3Provider
