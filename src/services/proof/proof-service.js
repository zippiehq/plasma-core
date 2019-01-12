const BaseService = require('../base-service')
const SnapshotManager = require('./snapshot-manager')

/**
 * Service that handles checking history proofs.
 */
class ProofSerivce extends BaseService {
  get name () {
    return 'prover'
  }

  /**
   * @param {*} transaction
   * @param {Array} proof
   */
  checkProof (transaction, deposits, proof) {
    const snapshotManager = new SnapshotManager()

    // Apply all of the deposits.
    deposits.forEach((deposit) => {
      if (!this._depositValid(deposit)) {
        throw new Error('Invalid deposit')
      }
      snapshotManager.applyDeposit(deposit)
    })

    // Apply each element of the proof.
    proof.forEach((element) => {
      if (!this._transactionValid(element)) {
        throw new Error('Invalid transaction')
      }
      snapshotManager.applyTransaction(element.transaction)
    })

    // Apply the transaction itself.
    snapshotManager.applyTransaction(transaction)

    const transfersValid = transaction.transfers.every((transfer) => {
      return snapshotManager.hasSnapshot({
        start: transfer.start,
        end: transfer.end,
        block: transaction.block,
        owner: transfer.to
      })
    })

    if (!transfersValid) {
      throw new Error('Invalid state transition')
    }

    return true
  }

  /**
   * Checks whether a deposit is valid.
   * @param {*} deposit Deposit to be checked.
   * @return {boolean} `true` if the deposit valid, `false` otherwise.
   */
  _depositValid (deposit) {
    return true // TODO: Implement this.
    // throw new Error('Not implemented')
  }

  _transactionValid (transaction) {
    return true
  }
}

module.exports = ProofSerivce
