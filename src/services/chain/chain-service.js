const BigNum = require('bn.js')
const utils = require('plasma-utils')
const models = utils.serialization.models
const SignedTransaction = models.SignedTransaction

const BaseService = require('../base-service')
const TransferManager = require('./transfer-manager')

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
    const transferManager = await this._getTransferMananger(address)
    const ranges = transferManager.getOwnedRanges(address)

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

  /**
   * Returns the number of the last known block.
   * @return {number} Latest block.
   */
  async getLatestBlock () {
    return this.services.db.get('latestblock', -1)
  }

  /**
   * Sets the latest block, if it really is the latest.
   * @param {number} block A block number.
   */
  async setLatestBlock (block) {
    const latest = await this.getLatestBlock()
    if (block > latest) {
      await this.services.db.set('latestblock', block)
    }
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
   * @param {string} hash Hash of the given block.
   */
  async addBlockHeader (block, hash) {
    await this.setLatestBlock(block)
    await this.services.db.set(`header:${block}`, hash)
  }

  /**
   * Adds multiple block headers to the database.
   * @param {Array} blocks An array of block objects.
   */
  async addBlockHeaders (blocks) {
    // Set the latest block.
    const latest = blocks.reduce((a, b) => {
      return a.number > b.number ? a : b
    })
    await this.setLatestBlock(latest.number)

    // Add each header as a batch operation.
    const ops = blocks.map((block) => {
      return {
        type: 'put',
        key: `header:${block.number}`,
        value: block.hash
      }
    })
    await this.services.db.db.batch(ops)
  }

  async pickRanges (address, token, amount) {
    const transferManager = await this._getTransferMananger(address)
    return transferManager.pickRanges(address, token, amount)
  }

  async pickTransfers (address, token, amount) {
    const transferManager = await this._getTransferMananger(address)
    return transferManager.pickTransfers(address, token, amount)
  }

  async markExited (range) {
    await this.services.db.set(`exited:${range.token}:${range.start}:${range.end}`, true)
  }

  async checkExited (range) {
    return this.services.db.get(`exited:${range.token}:${range.start}:${range.end}`, false)
  }

  async markFinalized (exit) {
    await this.services.db.set(`finalized:${exit.token}:${exit.start}:${exit.end}`, true)
  }

  async checkFinalized (exit) {
    return this.services.db.get(`finalized:${exit.token}:${exit.start}:${exit.end}`, false)
  }

  async addExit (exit) {
    await this.markExited(exit)
    await this._dbArrayPush(`exits:${exit.exiter}`, exit)
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

    return exitTxHashes
  }

  async getExits (address) {
    return this.services.db.get(`exits:${address}`, [])
  }

  async getExitsWithStatus (address) {
    const exits = await this.getExits(address)

    const currentBlock = await this.services.web3.eth.getBlockNumber()
    // const challengePeriod = await this.services.contract.getChallengePeriod()
    const challengePeriod = 20

    for (let exit of exits) {
      // TODO: Remove when we have a better way to handle BigNum parsing automatically.
      exit.token = new BigNum(exit.token, 'hex')
      exit.start = new BigNum(exit.start, 'hex')
      exit.end = new BigNum(exit.end, 'hex')

      exit.completed = (new BigNum(exit.block, 'hex').addn(challengePeriod)).ltn(currentBlock)
      exit.finalized = await this.checkFinalized(exit)
    }

    return exits
  }

  async finalizeExits (address) {
    const exits = await this.getExitsWithStatus(address)
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
   * Adds a new transaction to a history if it's valid.
   * @param {*} transaction A Transaction object.
   * @param {*} deposits A list of deposits for the transaction.
   * @param {*} proof A Proof object.
   */
  async addTransaction (transaction, deposits, proof) {
    const tx = new SignedTransaction(transaction)

    this.logger(`Verifying transaction proof for: ${tx.hash}`)
    if (!(await this.services.proof.checkProof(tx, deposits, proof))) {
      throw new Error('Invalid transaction proof')
    }
    this.logger(`Verified transaction proof for: ${tx.hash}`)

    // Add a pointer to this transaction for each recipient.
    const recipients = tx.transfers.reduce((recipients, transfer) => {
      if (!recipients.includes(transfer.recipient)) {
        recipients.push(transfer.recipient)
      }
      return recipients
    }, [])
    for (let recipient of recipients) {
      await this._dbArrayPush(`received:${recipient}`, tx.hash)
    }

    // Store the transaction and proof information.
    await this.services.db.set(`transaction:${tx.hash}`, tx.encoded)
    await this.services.db.set(`proof:${tx.hash}`, proof)

    this.logger(`Added transaction to database: ${tx.hash}`)
  }

  /**
   * Sends a transaction to the operator.
   * @param {*} transaction A transaction object.
   */
  async sendTransaction (transaction) {
    const tx = new SignedTransaction(transaction)
    // TODO: Make sure the transaction is valid.
    // This relies on the revamp of internal storage, not really important for now.

    // TODO: Check that the transaction receipt is valid.
    const receipt = await this.services.operator.sendTransaction(tx)
    this.logger(`Sent transaction to operator: ${tx.hash}.`)

    // TODO: Temporary.
    // Should be removed once operator exposes a way to get sent transactions for a user.
    // Add a pointer to this transaction for each sender.
    const senders = tx.transfers.reduce((senders, transfer) => {
      if (!senders.includes(transfer.sender)) {
        senders.push(transfer.sender)
      }
      return senders
    }, [])
    for (let sender of senders) {
      await this._dbArrayPush(`sent:${sender}`, tx.hash)
    }

    // TODO: Temporary.
    // Should be removed once operator exposes a way to get sent transactions for a user.
    await this.services.db.set(`transactions:${tx.hash}`, tx.encoded)

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

    await this._dbArrayPush(`deposits:${deposit.owner}`, deposit)

    // Weird quirk in how we handle exits.
    // TODO: Add link to something that explains this.
    await this.addExitableEnd(deposit.token, deposit.end)

    this.logger(`Added deposit to database`)
  }

  async getDeposits (address) {
    return this.services.db.get(`deposits:${address}`, [])
  }

  async addExitableEnd (token, end) {
    // TODO: Casting like this all over the place is bad practice.
    // Instead, we should force things to be casted already.
    token = new BigNum(token, 'hex')
    end = new BigNum(end, 'hex')

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

    let result = await this._itNext(it)
    while (!result.key.startsWith('exitable')) {
      result = await this._itNext(it)
    }

    return new BigNum(result.value, 'hex')
  }

  /**
   * Promsified version of `iterator.next`.
   * @param {*} it LevelDB iterator.
   * @return {*} The key and value returned by the iterator.
   */
  async _itNext (it) {
    return new Promise((resolve, reject) => {
      it.next((err, key, value) => {
        if (err) {
          reject(err)
        }
        resolve({ key, value })
      })
    })
  }

  /**
   * Returns the "typed" version of a start or end.
   * @param {BigNum} token The token ID.
   * @param {BigNum} value The value to type.
   * @return {BigNum} The typed value.
   */
  _getTypedValue (token, value) {
    return new BigNum(token.toString('hex', 8) + value.toString('hex', 24), 'hex')
  }

  /**
   * Helper function for pushing to an array stored at a key in the database.
   * @param {string} key The key at which the array is stored.
   * @param {*} value Value to add to the array.
   */
  async _dbArrayPush (key, value) {
    const current = await this.services.db.get(key, [])
    current.push(value)
    await this.services.db.set(key, current)
  }

  /**
   * Returns a new TransferManager object for a given address.
   * The TransferManager shows a list of available transfers.
   * @param {string} address An Ethereum address.
   * @return {TransferManager} Information about transfers to and from that address.
   */
  async _getTransferMananger (address) {
    const transferManager = new TransferManager()

    // Find transfers where address is recipient.
    const receivedTxs = await this.services.db.get(`received:${address}`, [])
    let receivedTransfers = []
    for (const hash of receivedTxs) {
      let tx = await this.services.db.get(`transaction:${hash}`)
      tx = new SignedTransaction(tx)
      for (const transfer of tx.transfers) {
        if (transfer.recipient === address) {
          receivedTransfers.push({
            ...transfer,
            ...{ block: tx.block }
          })
        }
      }
    }

    // Find transfers where address is sender.
    const sentTxs = await this.services.db.get(`sent:${address}`, [])
    let sentTransfers = []
    for (const hash of sentTxs) {
      let tx = await this.services.db.get(`transaction:${hash}`)
      tx = new SignedTransaction(tx)
      for (const transfer of tx.transfers) {
        if (transfer.sender === address) {
          sentTransfers.push({
            ...transfer,
            ...{ block: tx.block }
          })
        }
      }
    }

    // Add in deposits.
    const deposits = await this.getDeposits(address)
    receivedTransfers = receivedTransfers.concat(deposits)

    // Add in exits.
    const exits = await this.getExits(address)
    sentTransfers = sentTransfers.concat(exits)

    // Some light preprocessing before we apply each transfer.
    receivedTransfers = transferManager._castTransfers(receivedTransfers)
    sentTransfers = transferManager._castTransfers(sentTransfers)
    for (let transfer of receivedTransfers) {
      transfer.inbound = true
    }
    for (let transfer of sentTransfers) {
      transfer.inbound = false
    }

    // Join and sort the two arrays by block number and by start.
    let transfers = receivedTransfers.concat(sentTransfers)
    transfers.sort((a, b) => {
      if (!a.block.eq(b.block)) {
        return a.block.sub(b.block)
      } else {
        return a.start.sub(b.start)
      }
    })

    // Apply each transaction in block order.
    for (let transfer of transfers) {
      if (transfer.inbound) {
        transferManager.addTransfer(address, transfer)
      } else {
        transferManager.removeTransfer(address, transfer)
      }
    }

    return transferManager
  }
}

module.exports = ChainService
