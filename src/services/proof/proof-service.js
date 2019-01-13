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
   * Checks a transaction proof.
   * @param {*} transaction A Transaction object.
   * @param {Array} deposits A list of deposits.
   * @param {Array} proof A Proof object.
   * @return {boolean} `true` if the transaction is valid.
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

    // Apply the transaction itself and check that the transfers are valid.
    snapshotManager.applyTransaction(transaction)
    if (!snapshotManager.verifyTransaction(transaction)) {
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

  /**
   * Checks whether a transaction is valid.
   * @param {*} transaction A Transaction object.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  _transactionValid (transaction) {
    return true // TODO: Implement this.
    // throw new Error('Not implemented')
  }
}

module.exports = ProofSerivce
