const BaseOperatorProvider = require('./base-provider')
const utils = require('plasma-utils')

/**
 * Mocks an operator instead of sending real external requests.
 */
class MockOperatorProvider extends BaseOperatorProvider {
  constructor (options) {
    super(options)

    this.transactions = {}
  }

  async getTransaction (hash) {
    const tx = this.transactions[hash]
    let decoded = tx.decoded
    decoded.hash = tx.hash
    return decoded
  }

  async getTransactions (address, start, end) {
    let transactions = []
    for (let hash in this.transactions) {
      const tx = this.transactions[hash]
      const isRecipient = tx.transfers.some((transfer) => {
        return transfer.recipient === address
      })
      if (isRecipient && tx.block >= start && tx.block <= end) {
        transactions.push(tx)
      }
    }
    return transactions
  }

  async sendTransaction (transaction) {
    // TODO: Worth it to transaction validity?
    const tx = new utils.serialization.models.Transaction(transaction)

    this.transactions[tx.hash] = tx

    // TODO: Use the real block hash.
    await this.services.eth.contract.submitBlock('0x0')

    return tx.hash
  }
}

module.exports = MockOperatorProvider
