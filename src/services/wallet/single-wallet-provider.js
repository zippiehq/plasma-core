const BaseWalletProvider = require('./base-provider')

/**
 * Provider that mocks a wallet and shouldn't be used in production.
 */
class MockWalletProvider extends BaseWalletProvider {
  constructor (options) {
     super(options, {}) 
  }

  async _onStart () {
    this._initAccounts()
  }

  async getAccounts () {
    return this.accounts.map((account) => {
      return account.address
    })
  }

  async sign (address, data) {
    const account = this._getAccount(address)
    const signature = account.sign(data)

    return {
      signature: signature.signature,
      v: signature.v.slice(2),
      r: signature.r.slice(2),
      s: signature.s.slice(2)
    }
  }

  async createAccount () {
    const account = this.services.web3.eth.accounts.create()
    this.accounts.push(account)
    return account.address
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

   async addAccountToWallet (address) {
    const accounts = await this.services.web3.eth.accounts.wallet
    if (address in accounts) return

    const account = this._getAccount(address)
    await this.services.web3.eth.accounts.wallet.add(account.privateKey)
  }

  /**
   * Setup the intial set of fake accounts.
   */
  _initAccounts () {
    this.accounts = [this.services.web3.eth.accounts.privateKeyToAccount(this.options.singleAccountPrivateKey)]
  }
}

module.exports = MockWalletProvider
