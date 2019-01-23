const BaseService = require('../base-service')
const SnapshotManager = require('./snapshot-manager')
const utils = require('plasma-utils')
const models = utils.serialization.models
const SignedTransaction = models.SignedTransaction
const TransactionProof = models.TransactionProof

/**
 * Service that handles checking history proofs.
 */
class ProofSerivce extends BaseService {
  get name () {
    return 'proof'
  }

  /**
   * Checks a transaction proof.
   * @param {*} transaction A Transaction object.
   * @param {Array} deposits A list of deposits.
   * @param {Array} proof A Proof object.
   * @return {boolean} `true` if the transaction is valid.
   */
  async checkProof (transaction, deposits, proof) {
    // TODO: Maybe deposits should just be a special case of proof element?
    // Could be something like a single transfer transaction where sender is 0x0.
    const snapshotManager = new SnapshotManager()

    // Apply all of the deposits.
    for (let deposit of deposits) {
      if (!(await this._depositValid(deposit))) {
        throw new Error('Invalid deposit')
      }
      snapshotManager.applyDeposit(deposit)
    }

    // Apply each element of the proof.
    for (let element of proof) {
      if (!(await this._transactionValid(element.transaction, element.proof))) {
        throw new Error('Invalid transaction')
      }
      snapshotManager.applyTransaction(element.transaction)
    }

    // Apply the transaction itself and check that the transfers are valid.
    if (
      !(await this.checkTransaction(transaction, snapshotManager.snapshots))
    ) {
      throw new Error('Invalid state transition')
    }

    return true
  }

  /**
   * Checks that an individual transaction is valid given a set of snapshots.
   * @param {SignedTransaction} transaction A SignedTransaction object.
   * @param {*} snapshots A set of validated snapshots.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  async checkTransaction (transaction, snapshots) {
    // TODO: Fix utils so we don't need to do this.
    transaction.signatures = transaction.signatures.map((signature) => {
      return utils.utils.stringToSignature(signature)
    })
    const serializedTx = new SignedTransaction(transaction)

    const validTransition = SnapshotManager.verifyTransaction(
      transaction,
      snapshots
    )
    return validTransition && serializedTx.checkSigs()
  }

  /**
   * Checks whether a deposit is valid.
   * @param {*} deposit Deposit to be checked.
   * @return {boolean} `true` if the deposit valid, `false` otherwise.
   */
  async _depositValid (deposit) {
    return this.services.contract.depositValid(deposit)
  }

  /**
   * Checks whether a transaction is valid.
   * @param {UnsignedTransaction} transaction An UnsignedTransaction object.
   * @param {TransactionProof} proof A TransactionProof object.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  async _transactionValid (transaction, proof) {
    // TODO: Fix utils so we don't need to do this.
    proof.forEach((element) => {
      element.signature = utils.utils.stringToSignature(element.signature)
    })

    const serializedProof = new TransactionProof({
      transferProofs: proof
    })
    const root = await this.services.contract.getBlock(transaction.block)

    return utils.PlasmaMerkleSumTree.checkTransactionProof(
      transaction,
      serializedProof,
      root
    )
  }
}

module.exports = ProofSerivce
