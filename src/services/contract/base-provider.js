const BaseService = require('../base-service')

class BaseContractProvider extends BaseService {
  get name () {
    return 'contract'
  }

  async deposit (token, amount, owner) {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  async startExit () {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  async startChallenge () {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  async getBlock (block) {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }
}

module.exports = BaseContractProvider
