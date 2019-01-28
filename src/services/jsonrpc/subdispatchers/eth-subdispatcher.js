const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles Ethereum-related requests.
 */
class ETHSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  async deposit (token, amount, owner) {
    return this.app.services.contract.deposit(token, amount, owner)
  }

  async getNextBlock () {
    return this.app.services.contract.getNextBlock()
  }
}

module.exports = ETHSubdispatcher
