const BaseService = require('../base-service')

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
    return this.services.db.get(`transaction:${hash}`, null)
  }

  /**
   * Queries a block header by number.
   * @param {number} block Number of the block to query.
   * @return {string} Header of the specified block.
   */
  async getBlockHeader (block) {
    return this.services.db.get(`header:${block}`, null)
  }

  /**
   * Checks if the chain has stored a specific transaction already.
   * @param {string} hash The transaction hash.
   * @return {boolean} `true` if the chain has stored the transaction, `false` otherwise.
   */
  async hasTransaction (hash) {
    return this.services.db.exists(`transaction:${hash}`)
  }

  /**
   * Adds a block header to the database.
   * @param {*} block Number of the block to add.
   * @param {string} header Header of the given block.
   */
  async addBlockHeader (block, header) {
    // TODO: This should probably check that the block header is correct.
    return this.services.db.set(`header:${block}`, header)
  }

  /**
   * Adds a new transaction to a history if it's valid.
   * @param {*} transaction A Transaction object.
   * @param {*} deposits A list of deposits for the transaction.
   * @param {*} proof A Proof object.
   */
  async addTransaction (transaction, deposits, proof) {
    // TODO: Really we should also be checking that the transaction is actually relevant to the user.
    // We can do this by checking that the recipient of some xfer belongs to some account.

    if (!(await this.services.proof.checkProof(transaction, deposits, proof))) {
      throw new Error('Invalid transaction proof')
    }

    // TODO: Ideally we don't want to be modifying ranges like this.
    // Instead, we should just be storing the transactions and calculating ranges automatically.
    transaction.transfers.forEach((transfer) => {
      this.services.rangeManager.addRange(transfer.recipient, {
        token: transfer.token,
        start: transfer.start,
        end: transfer.end
      })
    })

    await this.services.db.set(
      `transaction:${transaction.hash}`,
      transaction.encoded
    )
    await this.services.db.set(`proof:${transaction.hash}`, proof)
  }

  /**
   * Sends a transaction to the operator.
   * @param {*} transaction A transaction object.
   */
  async sendTransaction (transaction) {
    /*
    // Make sure the transaction is valid.
    // TODO: This relies on the revamp of internal storage, not really important for now.
    const relevantRanges = this.services.rangeManager.getRelevantRanges(
      transaction
    )
    this.services.proof.checkTransaction(transaction, relevantRanges)
    */

    // TODO: Check this receipt is valid.
    const receipt = await this.services.operator.sendTransaction(transaction)

    // TODO: Ideally we don't want to be modifying ranges like this.
    // Instead, we should just be storing the transactions and calculating ranges automatically.
    transaction.transfers.forEach((transfer) => {
      this.services.rangeManager.removeRange(transfer.sender, {
        token: transfer.token,
        start: transfer.start,
        end: transfer.end
      })
    })

    return receipt
  }
}

module.exports = ChainService
