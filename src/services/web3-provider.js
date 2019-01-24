const Web3 = require('web3')
const BaseService = require('./base-service')

const defaultOptions = {
  provider: new Web3.providers.HttpProvider('http://localhost:8545')
}

class Web3Provider extends BaseService {
  constructor (options) {
    super(options, defaultOptions)
    this.web3 = new Web3(this.options.provider)
    Object.assign(this, this.web3)
  }

  get name () {
    return 'web3'
  }
}

module.exports = Web3Provider
