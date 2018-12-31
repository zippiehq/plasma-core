const Web3 = require('web3')
const BaseWalletProvider = require('./base-provider')

class MockWalletProvider extends BaseWalletProvider {
  constructor () {
    super()
    this.web3 = new Web3()
    this.accounts = Array.from({ length: 10 }, () => {
      return this.web3.eth.accounts.create()
    })
    this.addresses = this.accounts.map((account) => {
      return account.address
    })
  }

  get name () {
    return 'mock-wallet'
  }

  async getAccounts () {
    return this.addresses
  }
}

module.exports = MockWalletProvider
