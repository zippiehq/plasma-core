const BaseOperatorProvider = require('./base-provider')

/**
 * Mocks an operator instead of sending real external requests.
 */
class MockOperatorProvider extends BaseOperatorProvider {
  constructor (options) {
    super(options)

    this.transactions = {}
    this.pending = {}
  }

  async start () {
    this.started = true
  }

  async getTransaction (hash) {
    return JSON.parse(JSON.stringify(this.transactions[hash]))
  }

  async getPendingTransactions (address) {
    return this.pending[address] || []
  }

  async sendTransaction (transaction) {
    // TODO: Check transaction validity.
    const hash = Math.random() // TODO: Get the real hash of the tx.
    transaction.hash = hash
    this.transactions[hash] = transaction
    if (!this.pending[transaction.to]) {
      this.pending[transaction.to] = []
    }
    this.pending[transaction.to].push(hash)
    return hash
  }
}

module.exports = MockOperatorProvider
