const BaseWalletProvider = require('./base-provider')

/**
 * Wallet provider that simply passes requests off to web3.
 */
class Web3WalletProvider extends BaseWalletProvider {
  async getAccounts () {
    return this.services.web3.eth.getAccounts()
  }

  async sign (address, data) {
    return this.services.web3.eth.sign(data, address)
  }
}

module.exports = Web3WalletProvider
