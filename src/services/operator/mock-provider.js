const BaseOperatorProvider = require('./base-provider')
const utils = require('plasma-utils')

/**
 * Mocks an operator instead of sending real external requests.
 */
class MockOperatorProvider extends BaseOperatorProvider {
  constructor (options) {
    super(options)

    this.transactions = {}
    this.pending = {}
  }

  async getTransaction (hash) {
    const tx = this.transactions[hash]
    let decoded = tx.decoded
    decoded.hash = tx.hash
    return decoded
  }

  async getPendingTransactions (address) {
    return this.pending[address] || []
  }

  async sendTransaction (transaction) {
    // TODO: Check transaction validity.
    const tx = new utils.serialization.models.Transaction(transaction)

    this.transactions[tx.hash] = tx

    tx.decoded.transfers.forEach((transfer) => {
      if (!this.pending[transfer.recipient]) {
        this.pending[transfer.recipient] = []
      }
      this.pending[transfer.recipient].push(tx.hash)
    })

    return tx.hash
  }
}

module.exports = MockOperatorProvider
