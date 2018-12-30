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
   * Returns the list of ranges owned by the user.
   * @return {*} A list of owned ranges.
   */
  async getOwnedRanges () {
    throw new Error('Not implemented')
  }

  /**
   * Returns the balance of an account.
   * @param {string} address Address of the account to query.
   * @return {*} A list of tokens and balances.
   */
  async getBalance (address) {
    throw new Error('Not implemented')
  }

  /**
   * Queries a block by number.
   * @param {number} block Number of the block to query.
   * @return {*} Information about the block.
   */
  async getBlock (block) {
    throw new Error('Not implemented')
  }

  /**
   * Adds a block header to the database.
   * @param {*} block Number of the block to add.
   * @param {*} header Header of the given block.
   */
  async addBlockHeader (block, header) {
    throw new Error('Not implemented')
  }

  /**
   * Checks if the chunks in a history are actually part of their respective blocks.
   * @param {*} history A set of history chunks.
   * @return {boolean} `true` if the chunks are included, `false` otherwise.
   */
  checkHistoryChunksValid (history) {
    throw new Error('Not implemented')
  }

  /**
   * Checks that a transaction proof is valid.
   * @param {*} range A range identifier.
   * @param {*} history A history that contains proofs.
   * @return {boolean} `true` if the proof is valid, `false` otherwise.
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
   * Adds a new transaction to a history if it's valid.
   * @param {*} transaction A transaction object.
   */
  async addTransaction (transaction) {
    throw new Error('Not implemented')
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
