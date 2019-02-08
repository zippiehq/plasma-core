const BaseService = require('../base-service')
const SnapshotManager = require('./snapshot-manager')
const utils = require('plasma-utils')
const models = utils.serialization.models
const SignedTransaction = models.SignedTransaction
const TransactionProof = models.TransactionProof

const EMPTY_BLOCK_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

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
    transaction = new SignedTransaction(transaction)

    this.logger(`Checking signatures for: ${transaction.hash}`)
    if (!transaction.checkSigs()) {
      throw new Error('Invalid transaction signatures')
    }

    this.logger(`Checking validity of deposits for: ${transaction.hash}`)
    for (const deposit of deposits) {
      if (!(await this._depositValid(deposit))) {
        throw new Error('Invalid deposit')
      }
    }

    this.logger(`Checking validity of proof elements for: ${transaction.hash}`)
    for (const element of proof) {
      if (!(await this._transactionValid(element.transaction, element.proof))) {
        throw new Error('Invalid transaction')
      }
    }

    this.logger(`Applying proof elements for: ${transaction.hash}`)
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
    const serializedProof = new TransactionProof({
      transferProofs: proof
    })

    let root = await this.services.chaindb.getBlockHeader(transaction.block)
    if (root === null) {
      throw new Error(
        `Received transaction for non-existent block #${transaction.block}`
      )
    }

    // If the root is '0x00....', then this block was empty.
    if (root === EMPTY_BLOCK_HASH) {
      if (transaction.transfers.length > 0) {
        this.logger(
          `WARNING: Block #${
            transaction.block
          } is empty but received a non-empty proof element. Proof will likely be rejected. This is probably due to an error in the operator.`
        )
      }
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
