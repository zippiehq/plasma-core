const BaseWalletProvider = require('./base-provider')

/**
 * Provider for MetaMask wallet integration.
 */
class MetaMaskWalletProvider extends BaseWalletProvider {
  get name () {
    return 'metamask-wallet'
  }
}

module.exports = MetaMaskWalletProvider
