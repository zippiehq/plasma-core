const BaseService = require('../base-service')
const SnapshotManager = require('./snapshot-manager')
const utils = require('plasma-utils')

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

  async checkTransaction (transaction, snapshots) {
    const proof = transaction.signatures.map((signature) => {
      return {
        signature: signature
      }
    })

    const validTransition = SnapshotManager.verifyTransaction(
      transaction,
      snapshots
    )
    const validTransaction = await this._transactionValid(
      transaction,
      proof,
      false
    )
    return validTransition && validTransaction
  }

  /**
   * Checks whether a deposit is valid.
   * @param {*} deposit Deposit to be checked.
   * @return {boolean} `true` if the deposit valid, `false` otherwise.
   */
  async _depositValid (deposit) {
    return this.services.eth.contract.depositValid(deposit)
  }

  /**
   * Checks whether a transaction is valid.
   * @param {*} transaction A Transaction object.
   * @param {*} proof A Proof object.
   * @param {boolean} checkInclusion Whether to check that the transfers were included.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  async _transactionValid (transaction, proof, checkInclusion = true) {
    const serializedTx = new utils.serialization.models.Transaction(transaction)
    let blockHash
    if (checkInclusion) {
      blockHash = await this.services.eth.contract.getBlock(transaction.block)
    }

    // Verify signatures and inclusion proofs for every transfer in the transaction.
    for (let i = 0; i < transaction.transfers.length; i++) {
      let transferProof = proof[i]
      let transfer = transaction.transfers[i]

      // Convert the signature to a string if necessary.
      let signature = transferProof.signature
      if (!(signature instanceof String || typeof signature === 'string')) {
        signature =
          '0x' +
          signature.r.toString('hex') +
          signature.s.toString('hex') +
          signature.v.toString('hex')
      }

      // Check that this transfer was correctly signed.
      let signer = this.services.wallet.recover(serializedTx.hash, signature)
      if (signer !== transfer.sender) {
        throw new Error('Invalid transaction signature')
      }

      if (checkInclusion) {
        // Check that the transfer was included in the block.
        let included = utils.PlasmaMerkleSumTree.checkInclusion(
          transferProof.leafIndex,
          serializedTx,
          i,
          transferProof.inclusionProof,
          blockHash
        )
        if (!included) {
          throw new Error('Invalid inclusion proof')
        }
      }
    }

    return true
  }
}

module.exports = ProofSerivce
