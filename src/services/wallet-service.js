const BaseService = require('./base-service')

class WalletService extends BaseService {
  get name () {
    return 'wallet-service'
  }

  /**
   * Returns the list of available accounts in the wallet.
   * @return {*} A list of addresses.
   */
  async getAccounts () {
    throw new Error('Not implemented')
  }
}

module.exports = WalletService
