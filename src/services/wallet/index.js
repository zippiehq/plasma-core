const MockWalletProvider = require('./mock-provider')
const Web3WalletProvider = require('./web3-provider')

module.exports = {
  MockWalletProvider,
  Web3WalletProvider,
  DefaultWalletProvider: MockWalletProvider
}
