const BaseService = require('../base-service')

/**
 * Base class that operator providers must extend.
 */
class BaseOperatorProvider extends BaseService {
  constructor (options) {
    super()
    this.app = options.app
  }

  get name () {
    return 'operator'
  }

  /**
   * Returns the pending transactions to be received by address.
   * @param {*} address Address to query.
   * @return {*} List of pending transaction hashes.
   */
  async getPendingTransactions (address) {
    throw new Error(
      'Classes that extend BaseOperatorProvider must implement this method'
    )
  }

  /**
   * Queries the operator for a specific transaction.
   * @param {string} hash Hash of the transaction to query.
   * @return {*} A transaction, or null, along with an inclusion proof.
   */
  async getTransaction (hash) {
    throw new Error(
      'Classes that extend BaseOperatorProvider must implement this method'
    )
  }

  /**
   * Sends a transaction to the operator.
   * @param {*} transaction A transaction object.
   * @return {*} A transaction receipt from the operator.
   */
  async sendTransaction (transaction) {
    throw new Error(
      'Classes that extend BaseOperatorProvider must implement this method'
    )
  }
}

module.exports = BaseOperatorProvider
