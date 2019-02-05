const BigNum = require('bn.js')
const BaseService = require('../base-service')

/**
 * Handles chain-related DB calls.
 */
class ChainDB extends BaseService {
  get name () {
    return 'chaindb'
  }

  get dependencies () {
    return ['db']
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
   * Adds a transaction to the database.
   * @param {Transaction} transaction Transaction to store.
   */
  async setTransaction (transaction) {
    await this.services.db.set(
      `transaction:${transaction.hash}`,
      transaction.encoded
    )
  }

  /**
   * Temporary method for storing proofs.
   * @param {string} hash Hash of the transaction.
   * @param {Proof} proof A Proof object to store.
   */
  async setTransactionProof (hash, proof) {
    await this.services.db.set(`proof:${hash}`, proof)
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
   * @param {Array<Block>} blocks An array of block objects.
   */
  async addBlockHeaders (blocks) {
    // Set the latest block.
    const latest = blocks.reduce((a, b) => {
      return a.number > b.number ? a : b
    })
    await this.setLatestBlock(latest.number)

    if (this.services.db.db.batch) {
      // Add each header as a batch operation.
      const ops = blocks.map((block) => {
        return {
          type: 'put',
          key: `header:${block.number}`,
          value: block.hash
        }
      })
      await this.services.db.db.batch(ops)
    } else {
      for (let block of blocks) {
        await this.addBlockHeader(block.number, block.hash)
      }
    }
  }

  /**
   * Returns a list of known deposits for an address.
   * @param {string} address Address to query.
   * @return {Array<Deposit>} List of known deposits.
   */
  async getDeposits (address) {
    return this.services.db.get(`deposits:${address}`, [])
  }

  /**
   * Returns the list of known exits for an address.
   * @param {string} address Address to query.
   * @return {Array<Exit>} List of known exits.
   */
  async getExits (address) {
    return this.services.db.get(`exits:${address}`, [])
  }

  /**
   * Adds an exit to the database.
   * @param {Exit} exit Exit to add to database.
   */
  async addExit (exit) {
    await this.markExited(exit)
    await this._dbArrayPush(`exits:${exit.exiter}`, exit)
  }

  /**
   * Adds an "exitable end" to the database.
   * TODO: Add link that explains this.
   * @param {BigNum} token Token of the range.
   * @param {BigNum} end End of the range.
   */
  async addExitableEnd (token, end) {
    token = new BigNum(token, 'hex')
    end = new BigNum(end, 'hex')

    const key = this._getTypedValue(token, end)
    await this.services.db.set(`exitable:${key}`, end.toString('hex'))

    this.logger(`Added exitable end to database: ${token}:${end}`)
  }

  /**
   * Returns the correct exitable end for a range.
   * @param {BigNum} token Token of the range.
   * @param {BigNum} end End of the range.
   * @return {BigNum} The exitable end.
   */
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
   * Marks a range as exited.
   * @param {Range} range Range to mark.
   */
  async markExited (range) {
    await this.services.db.set(
      `exited:${range.token}:${range.start}:${range.end}`,
      true
    )
  }

  /**
   * Checks if a range is marked as exited.
   * @param {Range} range Range to check.
   * @return {boolean} `true` if the range is exited, `false` otherwise.
   */
  async checkExited (range) {
    return this.services.db.get(
      `exited:${range.token}:${range.start}:${range.end}`,
      false
    )
  }

  /**
   * Marks an exit as finalized.
   * @param {Exit} exit Exit to mark.
   */
  async markFinalized (exit) {
    await this.services.db.set(
      `finalized:${exit.token}:${exit.start}:${exit.end}`,
      true
    )
  }

  /**
   * Checks if an exit is marked as finalized.
   * @param {Exit} exit Exit to check.
   * @return {boolean} `true` if the exit is finalized, `false` otherwise.
   */
  async checkFinalized (exit) {
    return this.services.db.get(
      `finalized:${exit.token}:${exit.start}:${exit.end}`,
      false
    )
  }

  /**
   * Returns the latest state.
   * @return {Array<Snapshot>} A list of snapshots.
   */
  async getState () {
    return this.services.db.get(`state:latest`, [])
  }

  /**
   * Sets the latest state.
   * @param {Array<Snapshot>} state A list of snapshots.
   */
  async setState (state) {
    await this.services.db.set('state:latest', state)
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
   * Returns the "typed" version of a start or end.
   * @param {BigNum} token The token ID.
   * @param {BigNum} value The value to type.
   * @return {BigNum} The typed value.
   */
  _getTypedValue (token, value) {
    return new BigNum(
      token.toString('hex', 8) + value.toString('hex', 24),
      'hex'
    )
  }
}

module.exports = ChainDB
