const utils = require('plasma-utils')
const BaseWalletProvider = require('./base-provider')

/**
 * Wallet provider that simply passes requests off to web3.
 */
class Web3WalletProvider extends BaseWalletProvider {
  get dependencies () {
    return ['web3']
  }

  async getAccounts () {
    return this.services.web3.eth.getAccounts()
  }

  async sign (address, data) {
    const signature = await this.services.web3.eth.sign(data, address)
    return {
      ...utils.utils.stringToSignature(signature),
      ...{ signature: signature }
    }
  }

  async createAccount (password) {
    return this.services.web3.eth.personal.newAccount(password)
  }
}

module.exports = Web3WalletProvider
