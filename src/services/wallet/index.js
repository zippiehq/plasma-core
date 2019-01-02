const MockWalletProvider = require('./mock-provider')
const MetaMaskWalletProvider = require('./metamask-provider')

module.exports = {
  MockWalletProvider,
  MetaMaskWalletProvider,
  DefaultWalletProvider: MockWalletProvider
}
