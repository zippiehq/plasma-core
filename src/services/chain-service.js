const BaseService = require('./base-service')
const Chain = require('../chain')

/**
 * Manages the local blockchain.
 */
class ChainService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
    this.db = this.app.services.db
    this.chain = new Chain(this.db)
  }

  get name () {
    return 'chain-service'
  }

  /**
   * Determines whether the chain is currently syncing.
   * @return {boolean} `true` if the chain is syncing, `false` otherwise.
   */
  isSyncing () {
    throw new Error('Not implemented')
  }

  /**
   * Checks if a chunk of history is valid and adds it to the chain.
   * @param {*} range A coin range identifier.
   * @param {*} history A chunk of history to add.
   */
  addHistory (range, history) {
    throw new Error('Not implemented')
  }
}

module.exports = ChainService
