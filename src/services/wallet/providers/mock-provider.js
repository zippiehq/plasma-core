const Web3 = require('web3')
const BaseWalletProvider = require('./base-provider')

class MockWalletProvider extends BaseWalletProvider {
  constructor (options) {
    super()
    this.app = options.app
    this.web3 = new Web3()

    this._initAccounts()
  }

  get name () {
    return 'mock-wallet'
  }

  async getAccounts () {
    return this.addresses
  }

  _initAccounts () {
    this.accounts = Array.from({ length: 10 }, () => {
      return this.web3.eth.accounts.create()
    })
    this.addresses = this.accounts.map((account) => {
      return account.address
    })

    this.addresses.forEach((address, i) => {
      this.app.services.chain.addTransaction({
        from: address,
        to: address,
        range: {
          token: 'ETH',
          start: i * 1000000,
          end: (i + 1) * 1000000
        }
      })
    })
  }
}

module.exports = MockWalletProvider
