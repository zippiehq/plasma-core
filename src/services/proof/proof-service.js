const BaseService = require('../base-service')
const SnapshotManager = require('./snapshot-manager')
const utils = require('plasma-utils')
const models = utils.serialization.models
const SignedTransaction = models.SignedTransaction
const TransactionProof = models.TransactionProof
const Transfer = models.Transfer

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
    const snapshotManager = new SnapshotManager()

    // TODO: Fix utils so we don't need to do this.
    transaction.signatures = transaction.signatures.map((signature) => {
      return utils.utils.stringToSignature(signature)
    })
    transaction = new SignedTransaction(transaction)

    if (!transaction.checkSigs()) {
      throw new Error('Invalid transaction signatures')
    }

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

    if (!(snapshotManager.verifyTransaction(transaction))) {
      throw new Error('Invalid state transition')
    }

    return true
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

    let root = await this.services.chain.getBlockHeader(transaction.block)
    if (root === null) {
      root = await this.services.contract.getBlock(transaction.block)
      await this.services.chain.addBlockHeader(transaction.block, root)
    }

    // If the root is zero, then this block was empty so insert a fake transfer.
    // TODO: There's probably a cleaner way to do this but it works for now.
    if (root === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      transaction.isEmptyBlockTransaction = true
      transaction.transfers = [
        new Transfer({
          sender: '0x0000000000000000000000000000000000000000',
          recipient: '0x0000000000000000000000000000000000000000',
          start: 0,
          implicitStart: 0,
          end: 'ffffffffffffffffffffffff',
          implicitEnd: 'ffffffffffffffffffffffff'
        })
      ]
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
