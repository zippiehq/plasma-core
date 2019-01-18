const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles chain-related requests.
 */
class ChainSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  async getBalances (address) {
    return this.app.services.chain.getBalances(address)
  }

  async getBlock (block) {
    return this.app.services.chain.getBlock(block)
  }

  async getTransaction (hash) {
    return this.app.services.chain.getTransaction(hash)
  }

  async sendTransaction (transaction) {
    return this.app.services.chain.sendTransaction(transaction)
  }
}

module.exports = ChainSubdispatcher
