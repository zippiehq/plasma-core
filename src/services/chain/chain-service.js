const BigNum = require('bn.js')
const utils = require('plasma-utils')
const models = utils.serialization.models
const SignedTransaction = models.SignedTransaction

const BaseService = require('../base-service')

/**
 * Manages the local blockchain.
 */
class ChainService extends BaseService {
  get name () {
    return 'chain'
  }

  /**
   * Returns the balances of an account.
   * @param {string} address Address of the account to query.
   * @return {*} A list of tokens and balances.
   */
  async getBalances (address) {
    const ranges = await this.services.rangeManager.getOwnedRanges(address)

    let balances = {}
    for (let range of ranges) {
      // Set the balance of this token to zero if it hasn't been seen yet.
      if (!(range.token in balances)) {
        balances[range.token] = new BigNum(0)
      }

      // Add the size of this range.
      balances[range.token] = balances[range.token].add(
        range.end.sub(range.start)
      )
    }
    return balances
  }

  /**
   * Queries a transaction.
   * @param {string} hash Hash of the transaction.
   * @return {*} The transaction object.
   */
  async getTransaction (hash) {
    return this.services.db.get(`transaction:${hash}`, null)
  }

  async getLatestBlock () {
    return this.services.db.get('latestblock', -1)
  }

  async setLatestBlock (block) {
    const latest = await this.getLatestBlock()
    if (block <= latest) return
    return this.services.db.set('latestblock', block)
  }

  /**
   * Queries a block header by number.
   * @param {number} block Number of the block to query.
   * @return {string} Header of the specified block.
   */
  async getBlockHeader (block) {
    return this.services.db.get(`header:${block}`, null)
  }

  /**
   * Checks if the chain has stored a specific transaction already.
   * @param {string} hash The transaction hash.
   * @return {boolean} `true` if the chain has stored the transaction, `false` otherwise.
   */
  async hasTransaction (hash) {
    return this.services.db.exists(`transaction:${hash}`)
  }

  /**
   * Adds a block header to the database.
   * @param {*} block Number of the block to add.
   * @param {string} header Header of the given block.
   */
  async addBlockHeader (block, header) {
    await this.setLatestBlock(block)
    return this.services.db.set(`header:${block}`, header)
  }

  /**
   * Adds a new transaction to a history if it's valid.
   * @param {*} transaction A Transaction object.
   * @param {*} deposits A list of deposits for the transaction.
   * @param {*} proof A Proof object.
   */
  async addTransaction (transaction, deposits, proof) {
    const tx = new SignedTransaction(transaction)

    // TODO: Really we should also be checking that the transaction is actually relevant to the user.
    // We can do this by checking that the recipient of some xfer belongs to some account.

    this.logger(`Verifying transaction proof for: ${tx.hash}`)
    if (!(await this.services.proof.checkProof(tx, deposits, proof))) {
      throw new Error('Invalid transaction proof')
    }
    this.logger(`Verified transaction proof for: ${tx.hash}`)

    // TODO: Ideally we don't want to be modifying ranges like this.
    // Instead, we should just be storing the transactions and calculating ranges automatically.
    for (let transfer of tx.transfers) {
      const exited = await this.checkExited(transfer)
      if (exited) {
        this.logger(`Skipping adding range that has already been exited`)
        continue
      }
      await this.services.rangeManager.addRange(transfer.recipient, {
        token: transfer.token,
        start: transfer.start,
        end: transfer.end,
        block: tx.block
      })
    }

    await this.services.db.set(`transaction:${tx.hash}`, tx.encoded)
    await this.services.db.set(`proof:${tx.hash}`, proof)
    this.logger(`Added transaction to database: ${tx.hash}`)
  }

  async pickRanges (address, token, amount) {
    return this.services.rangeManager.pickRanges(address, token, amount)
  }

  async pickTransfers (address, token, amount) {
    return this.services.rangeManager.pickTransfers(address, token, amount)
  }

  async removeTransfers (address, transfers) {
    return this.services.rangeManager.removeTransfers(address, transfers)
  }

  async markExited (range) {
    return this.services.db.set(`exited:${range.token}:${range.start}:${range.end}`, true)
  }

  async checkExited (range) {
    return this.services.db.get(`exited:${range.token}:${range.start}:${range.end}`, false)
  }

  async addExit (exit) {
    await this.markExited(exit)
    await this.services.rangeManager.addExits(exit.exiter, [exit])
  }

  async removeExit (exit) {
    await this.services.rangeManager.removeExits(exit.exiter, [exit])
  }

  async startExit (address, token, amount) {
    const transfers = await this.pickTransfers(address, token, amount)
    let exited = []
    let exitTxHashes = []
    for (let transfer of transfers) {
      try {
        const exitTx = await this.services.contract.startExit(transfer.block, transfer.token, transfer.start, transfer.end, address)
        exitTxHashes.push(exitTx.transactionHash)
        exited.push(transfer)
      } catch (err) {
        this.logger(`ERROR: ${err}`)
      }
    }

    await this.services.rangeManager.removeRanges(address, exited)
    return exitTxHashes
  }

  async getExits (address) {
    const exits = await this.services.rangeManager.getExits(address)
    const currentBlock = await this.services.web3.eth.getBlockNumber()
    const challengePeriod = await this.services.contract.getChallengePeriod()
    exits.forEach((exit) => {
      exit.completed = (exit.block.addn(challengePeriod)).ltn(currentBlock)
    })
    return exits
  }

  async finalizeExits (address) {
    const exits = await this.getExits(address)
    const completed = exits.filter((exit) => {
      return exit.completed
    })

    let finalized = []
    let finalizeTxHashes = []
    for (let exit of completed) {
      try {
        const exitableEnd = await this.getExitableEnd(exit.token, exit.end)
        const finalizeTx = await this.services.contract.finalizeExit(exit.id, exitableEnd, address)
        finalizeTxHashes.push(finalizeTx.transactionHash)
        finalized.push(exit)
      } catch (err) {
        this.logger(`ERROR: ${err}`)
      }
    }

    return finalizeTxHashes
  }

  /**
   * Sends a transaction to the operator.
   * @param {*} transaction A transaction object.
   */
  async sendTransaction (transaction) {
    const tx = new SignedTransaction(transaction)
    // TODO: Make sure the transaction is valid.
    // This relies on the revamp of internal storage, not really important for now.

    // TODO: Check this receipt is valid.
    const receipt = await this.services.operator.sendTransaction(tx)
    this.logger(`Sent transaction to operator: ${tx.hash}.`)

    // TODO: Ideally we don't want to be modifying ranges like this.
    // Instead, we should just be storing the transactions and calculating ranges automatically.
    for (let transfer of tx.transfers) {
      await this.services.rangeManager.removeRange(transfer.sender, {
        token: transfer.token,
        start: transfer.start,
        end: transfer.end
      })
    }

    this.logger(`Added transaction to database: ${tx.hash}`)

    return receipt
  }

  /**
   * Adds a record of a deposit for a user.
   * @param {*} deposit A Deposit object.
   */
  async addDeposit (deposit) {
    const exited = await this.checkExited(deposit)
    if (exited) {
      this.logger(`Skipping adding deposit that has already been exited.`)
    }

    // TODO: Add a serialization object for Deposits.
    await this.services.rangeManager.addRange(deposit.owner, {
      token: deposit.token,
      start: deposit.start,
      end: deposit.end,
      block: deposit.block
    })
    this.logger(`Added deposit to database`)
  }

  async addExitableEnd (token, end) {
    const key = this._getTypedValue(token, end)
    await this.services.db.set(`exitable:${key}`, end.toString('hex'))
    this.logger(`Added exitable end to database: ${token}:${end}`)
  }

  async getExitableEnd (token, end) {
    const startKey = this._getTypedValue(token, end)
    const it = this.services.db.iterator({
      gte: `exitable:${startKey}`,
      keyAsBuffer: false,
      valueAsBuffer: false
    })

    let result = await this.itNext(it)
    while (!result.key.startsWith('exitable')) {
      result = await this.itNext(it)
    }
    return new BigNum(result.value, 'hex')
  }

  async itNext (it) {
    return new Promise((resolve, reject) => {
      it.next((err, key, value) => {
        if (err) {
          reject(err)
        }
        resolve({ key, value })
      })
    })
  }

  _getTypedValue (token, value) {
    return new BigNum(token.toString('hex', 8) + value.toString('hex', 24), 'hex')
  }
}

module.exports = ChainService
