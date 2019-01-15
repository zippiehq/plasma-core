const BaseService = require('../base-service')
const ContractProvider = require('./contract/mock-provider')

/**
 * Wraps interaction with Ethereum.
 */
class ETHService extends BaseService {
  constructor (options) {
    super(options)

    this.contract = new ContractProvider()
  }

  get name () {
    return 'eth'
  }
}

module.exports = ETHService
