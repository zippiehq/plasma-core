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

  get dependencies () {
    return ['contract', 'chaindb']
  }

  /**
   * Checks a transaction proof.
   * @param {Transaction} transaction A Transaction object.
   * @param {Array<Deposit>} deposits A list of deposits.
   * @param {Proof} proof A Proof object.
   * @return {boolean} `true` if the transaction is valid.
   */
  async checkProof (transaction, deposits, proof) {
    // TODO: Fix utils so we don't need to do this.
    transaction.signatures = transaction.signatures.map((signature) => {
      return utils.utils.stringToSignature(signature)
    })
    transaction = new SignedTransaction(transaction)

    if (!transaction.checkSigs()) {
      throw new Error('Invalid transaction signatures')
    }

    for (const deposit of deposits) {
      if (!(await this._depositValid(deposit))) {
        throw new Error('Invalid deposit')
      }
    }

    for (const element of proof) {
      if (!(await this._transactionValid(element.transaction, element.proof))) {
        throw new Error('Invalid transaction')
      }
    }

    const snapshotManager = new SnapshotManager()
    this.applyProof(snapshotManager, deposits, proof)
    if (!snapshotManager.validateTransaction(transaction)) {
      throw new Error('Invalid state transition')
    }

    return true
  }

  /**
   * Applies a transaction proof to a SnapshotManager.
   * @param {SnapshotManager} snapshotManager SnapshotManger to apply to.
   * @param {Array<Deposit>} deposits Deposits to apply.
   * @param {Proof} proof Proof to apply.
   */
  applyProof (snapshotManager, deposits, proof) {
    for (const deposit of deposits) {
      snapshotManager.applyDeposit(deposit)
    }

    for (const element of proof) {
      const tx = element.transaction
      if (tx.isEmptyBlockTransaction) {
        snapshotManager.applyEmptyBlock(tx.block)
      } else {
        snapshotManager.applyTransaction(element.transaction)
      }
    }
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

    let root = await this.services.chaindb.getBlockHeader(transaction.block)
    if (root === null) {
      root = await this.services.contract.getBlock(transaction.block)
      await this.services.chaindb.addBlockHeader(transaction.block, root)
    }

    // If the root is zero, then this block was empty so insert a fake transfer.
    // TODO: There's probably a cleaner way to do this but it works for now.
    if (
      root ===
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      transaction.isEmptyBlockTransaction = true
      return true
    }

    root = root + 'ffffffffffffffffffffffffffffffff'

    // Hack for now, make sure that all other transactions aren't fake.
    transaction.isEmptyBlockTransaction = false
    transaction.transfers.forEach((transfer, i) => {
      const {
        implicitStart,
        implicitEnd
      } = utils.PlasmaMerkleSumTree.getTransferProofBounds(
        transaction,
        serializedProof.transferProofs[i]
      )
      transfer.implicitStart = implicitStart
      transfer.implicitEnd = implicitEnd
    })

    return utils.PlasmaMerkleSumTree.checkTransactionProof(
      transaction,
      serializedProof,
      root
    )
  }
}

module.exports = ProofSerivce
