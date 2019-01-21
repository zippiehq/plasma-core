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

    const deposits = this._getDeposits(decoded)

    const earliestBlock = deposits.reduce((prev, curr) => {
      return prev.block > curr.block ? curr : prev
    })
    const currentBlock = await this.services.eth.contract.getCurrentBlock()

    // TODO: ?? Generate a proof?
    const proof = this._getHistory(decoded, earliestBlock, currentBlock)

    return {
      transaction: new utils.serialization.models.UnsignedTransaction(decoded),
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
        transactions.push(tx.encoded)
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

  _getDeposits (transaction) {
    return this.services.eth.contract.deposits.filter((deposit) => {
      return transaction.transfers.some((transfer) => {
        return this._rangesOverlap(deposit, transfer)
      })
    })
  }

  _getHistory (transaction, start, end) {
    // Sorry, this code is awful. TODO: Fix.
    let history = []
    for (let i = start; i < end; i++) {
      // Get all of the transactions for the block.
      let transactions = this._getTransactionsByBlock(i)

      // Figure out which transactions overlap with the range.
      let overlapping = transactions.filter((tx) => {
        return tx.transfers.some((tsfr) => {
          return transaction.transfers((transfer) => {
            return this._rangesOverlap(tsfr, transfer)
          })
        })
      })

      // Create a proof element for each transaction.
      // TODO: Does not support multisends.
      let proofs = overlapping.map((element) => {
        return {
          transaction: element,
          proof: element.signatures.map((signature) => {
            return {
              leafIndex: new BigNum(0),
              parsedSum: new BigNum('ffffffffffffffffffffffffffffffff'),
              inclusionProof: [
                '0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffff'
              ],
              signature: signature
            }
          })
        }
      })

      history = history.concat(proofs)
    }
    return history
  }

  _getTransactionsByBlock (block) {
    let transactions = []
    for (let hash in this.transactions) {
      const tx = this.transactions[hash]
      if (tx.block.eq(new BigNum(block))) {
        transactions.push(tx)
      }
    }
    return transactions
  }

  _rangesOverlap (a, b) {
    return (
      a.token.eq(new BigNum(a.token)) &&
      Math.max(a.start, b.start) < Math.min(a.end, b.end)
    )
  }
}

module.exports = MockOperatorProvider
