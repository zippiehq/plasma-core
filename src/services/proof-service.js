const BaseService = require('./base-service')

/**
 * Service that handles checking history proofs.
 */
class ProofSerivce extends BaseService {
  get name () {
    return 'prover'
  }

  /**
   * Checks whether a transaction is valid or not.
   * @param {*} transaction Transaction to be validated.
   * @param {*} deposits A list of original deposits for that range.
   * @param {*} history A history of transactions and proofs for that range.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  checkProof (transaction, deposits, history) {
    // TODO: Also check that start and end are within bounds.
    if (transaction.range.end <= transaction.range.start) {
      throw new Error('Invalid range')
    }
    // TODO: Check that the history chunks are correctly formed.

    // Check that the deposits are valid for the given range.
    // TODO: Throw if false.
    this._checkDepositsValid(deposits, transaction.range)

    // Determine where to start checking the history.
    const earliestDeposit = deposits.reduce((prev, curr) => {
      return prev.block < curr.block ? prev : curr
    })

    // Check that the ranges are all covered.
    // TODO: Throw if false.
    const requiredRanges = this._getRequiredRanges(deposits)
    for (let i = earliestDeposit.block; i < transaction.block; i++) {
      let chunks = history[i]
      let requiredRange = this._nextLowerValue(requiredRanges, i)
      this._checkChunksCoverRange(requiredRange, chunks)
    }

    // Check that the chunks are all valid.
    // We do this in a separate loop because it's computationally intensive.
    // TODO: Throw if false.
    for (let block in history) {
      let chunks = history[block]
      for (let chunk of chunks) {
        this._checkChunkValid(block, chunk)
      }
    }

    return true
  }

  /**
   * Checks whether a list of deposits are valid for a range.
   * @param {*} deposits Deposits to be checked.
   * @param {*} range Range created by those deposits.
   * @return {boolean} `true` if the deposits are valid, `false` otherwise.
   */
  _checkDepositsValid (deposits, range) {
    throw new Error('Not implemented')
  }

  /**
   * Checks whether a list of chunks are touching.
   * Two chunks are touching if the end of the first is
   * immediately followed by the start of the second.
   * @param {*} chunks A list of chunks
   * @return {boolean} `true` if the chunks are touching, `false` otherwise.
   */
  _checkChunksTouch (chunks) {
    return chunks.every((chunk, i) => {
      return i === 0 || chunk.tx.start === chunks[i - 1].tx.end + 1
    })
  }

  /**
   * Checks if a set of chunks cover an entire range.
   * @param {*} range Range to be covered.
   * @param {*} chunks Chunks to be checked.
   * @return {boolean} `true` if the chunks cover the range, `false` otherwise.
   */
  _checkChunksCoverRange (range, chunks) {
    const sortedChunks = chunks.sort((a, b) => {
      return a.tx.start - b.tx.start
    })

    const firstChunk = sortedChunks[0]
    const lastChunk = sortedChunks[sortedChunks.length - 1]
    return range.start >= firstChunk.tx.start && range.end <= lastChunk.tx.end && this._checkChunksTouch(sortedChunks)
  }

  /**
   * Checks if a chunk is included in the specified block.
   * @param {*} block Block in which the chunk is included.
   * @param {*} chunk Chunk to be validated.
   * @return {boolean} `true` if the chunk is valid, `false` otherwise.
   */
  _checkChunkValid (block, chunk) {
    // TODO: Implement this.
    return true
  }

  /**
   * Returns the value of the next lower key on an object.
   * @param {*} obj Object to query.
   * @param {number} x An integer key.
   * @return {*} Value of the next key smaller than or equal to `x`.
   */
  _nextLowerValue (obj, x) {
    x = parseInt(x)

    let lowest = -1
    for (let key in obj) {
      key = parseInt(key)
      if (key > lowest && key <= x) {
        lowest = key
      }
    }

    return obj[lowest]
  }

  /**
   * Returns an object that describes when parts of a range
   * were created based on the original deposits.
   * @param {*} deposits A list of deposits
   * @return {Object} An object that maps from block numbers to ranges.
   */
  _getRequiredRanges (deposits) {
    const sortedDeposits = deposits.sort((a, b) => {
      return a.start - b.start
    })
    const firstDeposit = sortedDeposits[0]

    let requiredRanges = {}
    for (let deposit of deposits) {
      requiredRanges[deposit.block] = {
        start: firstDeposit.start,
        end: deposit.end
      }
    }

    return requiredRanges
  }
}

module.exports = ProofSerivce
