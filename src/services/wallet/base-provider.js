const BaseService = require('../base-service')

/**
 * Base class for all wallet providers.
 */
class BaseWalletProvider extends BaseService {
  get name () {
    return 'wallet'
  }

  /**
   * Returns the addresses of all accounts in this wallet.
   * @return {Array<String>} List of addresses in this wallet
   */
  async getAccounts () {
    throw new Error(
      'Classes that extend BaseWalletProvider must implement this method'
    )
  }

  /**
   * Signs a piece of arbitrary data.
   * @param {string} address Address of the account to sign with.
   * @param {*} data Data to sign
   * @return {*} Signature over the data.
   */
  async sign (address, data) {
    throw new Error(
      'Classes that extend BaseWalletProvider must implement this method'
    )
  }

  /**
   * Recovers the address that signed a message.
   * @param {string} message Message that was signed.
   * @param {string} signature Signature generated.
   * @return {string} Address of the signer.
   */
  recover (message, signature) {
    return this.services.web3.eth.accounts.recover(message, signature)
  }
}

module.exports = BaseWalletProvider
