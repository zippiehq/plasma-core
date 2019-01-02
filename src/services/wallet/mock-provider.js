const Web3 = require('web3')
const BaseWalletProvider = require('./base-provider')

/**
 * Provider that mocks a wallet and shouldn't be used in production.
 */
class MockWalletProvider extends BaseWalletProvider {
  constructor (options) {
    super(options)

    this.web3 = new Web3()
    this._initAccounts()
  }

  get name () {
    return 'mock-wallet'
  }

  async getAccounts () {
    return this.addresses
  }

  async sign (address, data) {
    const account = this._getAccount(address)
    return account.sign(data)
  }

  /**
   * Returns the account with the given address,
   * @param {*} address Address of the account.
   * @return {*} The account with that address.
   */
  _getAccount (address) {
    const account = this.accounts.find((acc) => {
      return acc.address === address
    })

    if (account === undefined) {
      throw new Error('Account not found')
    }
    return account
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
