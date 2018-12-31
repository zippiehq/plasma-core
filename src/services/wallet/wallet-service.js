const BaseService = require('../base-service')
const MockWalletProvider = require('./providers/mock-provider')
const MetaMaskWalletProvider = require('./providers/metamask-provider')

const providers = {
  'mock': MockWalletProvider,
  'metamask': MetaMaskWalletProvider
}

class WalletService extends BaseService {
  constructor (options) {
    super()
    this.provider = new providers[options.provider]()
  }

  get name () {
    return 'wallet'
  }

  /**
   * Returns the list of available accounts in the wallet.
   * @return {*} A list of addresses.
   */
  async getAccounts () {
    return this.provider.getAccounts()
  }
}

module.exports = WalletService
