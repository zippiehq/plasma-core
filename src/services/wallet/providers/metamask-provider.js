const BaseWalletProvider = require('./base-provider')

class MetaMaskWalletProvider extends BaseWalletProvider {
  get name () {
    return 'metamask-wallet'
  }
}

module.exports = MetaMaskWalletProvider
