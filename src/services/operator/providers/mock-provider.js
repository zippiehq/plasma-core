const BaseOperatorProvider = require('./base-provider')

class MockOperatorProvider extends BaseOperatorProvider {
  constructor () {
    super()
    this.transactions = {}
    this.pending = {}
  }

  get name () {
    return 'mock-operator'
  }

  async getTransaction (hash) {
    return this.transactions[hash]
  }

  async getPendingTransactions (address) {
    return this.pending[address]
  }

  async sendTransaction (transaction) {
    // TODO: Check transaction validity.
    const hash = Math.random() // TODO: Get the real hash of the tx.
    this.transactions[hash] = transaction
    if (!this.pending[transaction.to]) {
      this.pending[transaction.to] = []
    }
    this.pending[transaction.to].push(hash)
  }
}

module.exports = MockOperatorProvider
