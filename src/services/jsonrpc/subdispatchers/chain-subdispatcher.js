const BaseSubdispatcher = require('./base-subdispatcher')

// TODO: Since subdispatchers are just pointing to other methods,
// should we just have them be objects with function names as keys
// and functions as values?

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

  async pickRanges (address, token, amount) {
    return this.app.services.chain.pickRanges(address, token, amount)
  }

  async startExit (address, token, amount) {
    return this.app.services.chain.startExit(address, token, amount)
  }

  async finalizeExits (address) {
    return this.app.services.chain.finalizeExits(address)
  }

  async getExits (address) {
    return this.app.services.chain.getExits(address)
  }
}

module.exports = ChainSubdispatcher
