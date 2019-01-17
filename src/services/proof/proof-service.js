const Web3 = require('web3')
const BaseService = require('../base-service')
const SnapshotManager = require('./snapshot-manager')
const utils = require('plasma-utils')

/**
 * Service that handles checking history proofs.
 */
class ProofSerivce extends BaseService {
  constructor (options) {
    super(options)

    this.web3 = new Web3()
  }

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
  async checkProof (transaction, deposits, proof) {
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
  async _depositValid (deposit) {
    return this.services.eth.contract.depositValid(deposit)
  }

  /**
   * Checks whether a transaction is valid.
   * @param {*} transaction A Transaction object.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  async _transactionValid (transaction, proof) {
    const serializedTx = new utils.serialization.models.Transaction(transaction)
    const blockHash = await this.services.eth.contract.getBlock(
      transaction.block
    )

    // Verify signatures and inclusion proofs for every transfer in the transaction.
    for (let i = 0; i < transaction.transfers.length; i++) {
      let transferProof = proof[i]
      let transfer = transaction.transfers[i]

      // Convert the signature to a string if necessary.
      let signature = transferProof.signature
      if (!(signature instanceof String || typeof signature === 'string')) {
        signature = '0x' + signature.r + signature.s + signature.v
      }

      // Check that this transfer was correctly signed.
      let signer = this.web3.eth.accounts.recover(serializedTx.hash, signature)
      if (signer !== transfer.sender) {
        throw new Error('Invalid transaction signature')
      }

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

    return true
  }
}

module.exports = ProofSerivce
