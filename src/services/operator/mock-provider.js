const BigNum = require('bn.js')
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

  async getTransaction (encoded) {
    const tx = this.transactions[encoded]
    let decoded = tx.decoded
    decoded.hash = tx.hash

    const deposits = this.services.eth.contract.deposits.filter((deposit) => {
      return decoded.transfers.some((transfer) => {
        return (
          transfer.token.eq(new BigNum(deposit.token)) &&
          Math.max(transfer.start, deposit.start) <
            Math.min(transfer.end, deposit.end)
        )
      })
    })

    // TODO: ?? Generate a proof?
    const proof = []

    return {
      transaction: decoded,
      deposits: deposits,
      proof: proof
    }
  }

  async getTransactions (address, start, end) {
    start = new BigNum(start, 'hex')
    end = new BigNum(end, 'hex')

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
    const tx = new utils.serialization.models.Transaction(transaction)
    const signedTx = new utils.serialization.models.SignedTransaction(
      transaction
    )

    this.transactions[tx.encoded] = signedTx

    // TODO: Use the real block hash.
    const blockhash = new utils.PlasmaMerkleSumTree([tx]).root().data
    await this.services.eth.contract.submitBlock(blockhash)

    return tx.hash
  }
}

module.exports = MockOperatorProvider
