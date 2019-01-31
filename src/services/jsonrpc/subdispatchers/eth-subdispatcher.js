const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles Ethereum-related requests.
 */
class ETHSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  async listToken (tokenAddress) {
    return this.app.services.contract.listToken(tokenAddress)
  }

  async getTokenId (tokenAddress) {
    return this.app.services.contract.getTokenId(tokenAddress)
  }

  async deposit (token, amount, owner) {
    return this.app.services.contract.deposit(token, amount, owner)
  }
}

module.exports = ETHSubdispatcher
