const BaseService = require('./base-service')

class ETHService extends BaseService {
  get name () {
    return 'eth'
  }

  get dependencies () {
    return ['web3']
  }

  getBalance (address) {
    return this.services.web3.eth.getBalance(address)
  }

  getCurrentBlock () {
    return this.services.web3.getBlockNumber()
  }
}

module.exports = ETHService
