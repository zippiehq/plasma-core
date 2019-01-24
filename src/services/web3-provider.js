const Web3 = require('web3')
const BaseService = require('./base-service')

class Web3Provider extends BaseService {
  constructor (options) {
    super(options)
    this.web3 = new Web3()
    Object.assign(this, this.web3)
  }

  get name () {
    return 'web3'
  }
}

module.exports = Web3Provider
