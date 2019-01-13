const BaseService = require('./base-service')

/**
 * Manages the local blockchain.
 */
class ChainService extends BaseService {
  get name () {
    return 'chain'
  }

  /**
   * Determines whether the chain is currently syncing.
   * @return {boolean} `true` if the chain is syncing, `false` otherwise.
   */
  isSyncing () {
    throw new Error('Not implemented')
  }

  /**
   * Returns the balances of an account.
   * @param {string} address Address of the account to query.
   * @return {*} A list of tokens and balances.
   */
  async getBalances (address) {
    const ranges = await this.services.rangeManager.getOwnedRanges(address)
    let balances = {}
    for (let range of ranges) {
      if (!(range.token in balances)) {
        balances[range.token] = 0
      }
      balances[range.token] += range.end - range.start
    }
    return balances
  }

  /**
   * Queries a transaction.
   * @param {string} hash Hash of the transaction.
   * @return {*} The transaction object.
   */
  async getTransaction (hash) {
    return this.services.db.get(`transaction:${hash}`)
  }

  /**
   * Queries a block header by number.
   * @param {number} block Number of the block to query.
   * @return {string} Header of the specified block.
   */
  async getBlockHeader (block) {
    return this.services.db.get(`header:${block}`)
  }

  /**
   * Adds a block header to the database.
   * @param {*} block Number of the block to add.
   * @param {string} header Header of the given block.
   */
  async addBlockHeader (block, header) {
    return this.services.db.set(`header:${block}`, header)
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
   * @param {*} transaction A transaction object
   */
  checkProofAndAddHistory (transaction) {
    // TODO: This is not actually how new transactions should be handled.
    this.addTransaction(transaction)

    /*
    // TODO: Make sure this correctly checks the transaction proof.
    if (this.checkTransactionProof(transaction.range, transaction.history)) {
      throw new Error('Transaction proof is not valid')
    }
    this._addHistory(transaction.history)
    */
  }

  /**
   * Checks if the chain has stored a specific transaction already.
   * @param {string} hash The transaction hash.
   * @return {boolean} `true` if the chain has stored the transaction, `false` otherwise.
   */
  async hasTransaction (hash) {
    let tx = await this.services.db.get(`transaction:${hash}`)
    return tx !== undefined
  }

  /**
   * Adds a new transaction to a history if it's valid.
   * @param {*} transaction A transaction object.
   */
  async addTransaction (transaction) {
    // TODO: Check if the transaction is valid.
    this.services.rangeManager.addRange(transaction.to, transaction.range)
    await this.services.db.set(`transaction:${transaction.hash}`, transaction)
  }

  /**
   * Sends a transaction to the operator.
   * @param {*} transaction A transaction object.
   */
  async sendTransaction (transaction) {
    // TODO: Check that the range being sent is valid.

    const senderOwnsRange = this.services.rangeManager.ownsRange(
      transaction.from,
      [transaction.range.start, transaction.range.end]
    )

    if (!senderOwnsRange) {
      throw new Error('Sender does not own the specified range')
    }

    const receipt = await this.services.operator.sendTransaction(transaction)

    this.rangeManager.removeRange(transaction.from, transaction.range)

    return receipt
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
