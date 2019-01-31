const MockWalletProvider = require('./mock-provider')
const Web3WalletProvider = require('./web3-provider')
const LocalWalletProvider = require('./local-provider')

module.exports = {
  MockWalletProvider,
  Web3WalletProvider,
  LocalWalletProvider,
  DefaultWalletProvider: MockWalletProvider
}
