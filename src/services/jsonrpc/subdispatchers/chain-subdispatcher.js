const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles chain-related requests.
 */
class ChainSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  get methods () {
    const chain = this.app.services.chain
    return {
      getBalances: chain.getBalances.bind(chain),
      getBlockHeader: chain.getBlockHeader.bind(chain),
      getTransaction: chain.getTransaction.bind(chain),
      sendTransaction: chain.sendTransaction.bind(chain),
      pickRanges: chain.pickRanges.bind(chain),
      startExit: chain.startExit.bind(chain),
      finalizeExits: chain.finalizeExits.bind(chain),
      getExits: chain.getExits.bind(chain)
    }
  }
}

module.exports = ChainSubdispatcher
