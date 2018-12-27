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
   * Checks if the chunks in a history are actually part of their respective blocks.
   * @param {*} history A set of history chunks.
   * @returns {boolean} `true` if the chunks are included, `false` otherwise.
   */
  checkHistoryChunksValid (history) {
    throw new Error('Not implemented')
  }

  /**
   * Checks that a transaction proof is valid.
   * @param {*} range A range identifier.
   * @param {*} history A history that contains proofs.
   * @returns {boolean} `true` if the proof is valid, `false` otherwise.
   */
  checkTransactionProof (range, history) {
    throw new Error('Not implemented')
  }

  /**
   * Checks if a set of history chunks is valid and adds it to the chain.
   * @param {*} history A set of history chunks.
   */
  addHistory (history) {
    if (!this.checkHistoryChunksValid(history)) {
      throw new Error('History is not valid')
    }
    this._addHistory(history)
  }

  /**
   * Checks a transaction proof and adds history if the transaction is valid.
   * @param {*} range A range identifier.
   * @param {*} history A chunk of history for that range.
   */
  checkProofAndAddHistory (range, history) {
    // TODO: Make sure this correctly checks the transaction proof.
    if (this.checkTransactionProof(range, history)) {
      throw new Error('Transaction proof is not valid')
    }
    this._addHistory(history)
  }

  /**
   * Inserts a set of history chunks into the chain.
   * @private
   * @param {*} history A set of history chunks.
   */
  _addHistory (history) {
    throw new Error('Not implemented')
  }
}

module.exports = ChainService
