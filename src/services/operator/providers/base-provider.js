class BaseOperatorProvider {
  get name () {
    throw new Error('Classes that extend BaseOperatorProvider must implement this method')
  }

  /**
   * Returns the pending transactions to be received by address.
   * @param {*} address Address to query.
   * @return {*} List of pending transaction hashes.
   */
  getPendingTransactions (address) {
    throw new Error('Classes that extend BaseOperatorProvider must implement this method')
  }

  /**
   * Queries the operator for a specific transaction.
   * @param {string} hash Hash of the transaction to query.
   * @return {*} A transaction, or null, along with an inclusion proof.
   */
  getTransaction (hash) {
    throw new Error('Classes that extend BaseOperatorProvider must implement this method')
  }

  /**
   * Sends a transaction to the operator.
   * @param {*} transaction A transaction object.
   * @return {*} A transaction receipt from the operator.
   */
  sendTransaction (transaction) {
    throw new Error('Classes that extend BaseOperatorProvider must implement this method')
  }
}

module.exports = BaseOperatorProvider
