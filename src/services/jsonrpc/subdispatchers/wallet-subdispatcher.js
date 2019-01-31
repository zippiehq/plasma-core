const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles wallet-related requests.
 */
class WalletSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  async getAccounts () {
    return this.app.services.wallet.getAccounts()
  }

  async sign (address, data) {
    return this.app.services.wallet.sign(address, data)
  }

  async createAccount () {
    return this.app.services.wallet.createAccount()
  }
}

module.exports = WalletSubdispatcher
