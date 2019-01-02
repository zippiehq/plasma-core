const BaseService = require('../base-service')

/**
 * Base class for all wallet providers.
 */
class BaseWalletProvider extends BaseService {
  constructor (options) {
    super()
    this.app = options.app
  }

  get name () {
    return 'wallet'
  }

  /**
   * Returns the addresses of all accounts in this wallet.
   * @return {*} List of addresses in this wallet
   */
  async getAccounts () {
    throw new Error('Classes that extend BaseWalletProvider must implement this method')
  }

  /**
   * Signs a piece of arbitrary data.
   * @param {string} address Address of the account to sign with.
   * @param {*} data Data to sign
   * @return {*} Signature over the data.
   */
  async sign (address, data) {
    throw new Error('Classes that extend BaseWalletProvider must implement this method')
  }
}

module.exports = BaseWalletProvider
