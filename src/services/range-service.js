const BaseService = require('./base-service')

/**
 * Validates a range.
 * - Range start should be >= 0
 * - Range start should be < range end
 * @param {*} range A range object.
 * @return {boolean} `true` if the range is valid, `false` otherwise.
 */
function isValidRange (range) {
  const [start, end] = range
  return start >= 0 && start < end
}

/**
 * Orders the provided ranges, collapsing them if possible
 * @param {*} rangeA A range object.
 * @param {*} rangeB A range object.
 * @return {array} array of ordered ranges
 */
function orderRanges (rangeA, rangeB) {
  // No curRange and new range comes before current range
  if (rangeA[1] < rangeB[0]) {
    return [rangeA, rangeB]
  } else if (rangeA[0] === rangeB[1]) {
    // No curRange and new range start == current range end
    // merge to end of current range
    rangeB[1] = rangeA[1]
    return [rangeB]
  } else if (rangeA[1] === rangeB[0]) {
    // If new range end == current range start
    // merge to front of current range
    rangeB[0] = rangeA[0]
    return [rangeB]
  } else {
    return [rangeB, rangeA]
  }
}

/**
 * Service that manages the user's ranges automatically.
 */
class RangeManagerService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
    this.db = this.app.services.db
  }

  get name () {
    return 'rangeManager'
  }

  /**
   * Returns the list of ranges owned by an address.
   * @param {string} address An address.
   * @return {*} List of owned ranges.
   */
  async getOwnedRanges (address) {
    return (await this.db.get(`ranges:${address}`)) || []
  }

  /**
   * Determines if an address owners a specific range.
   * i.e. if a user owns range [0, 100] and this method is
   * called with [10, 30], it will return true.
   * @param {string} address An address.
   * @param {*} range A range object.
   * @return {boolean} `true` if the user owns the range, `false` otherwise.
   */
  async ownsRange (address, range) {
    const ownedRanges = await this.getOwnedRanges(address)
    const [start, end] = range
    return ownedRanges.some(
      ([ownedStart, ownedEnd]) => ownedStart <= start && ownedEnd >= end
    )
  }

  /**
   * Picks the best ranges for a given transaction.
   * @param {string} address An address.
   * @param {string} token Identifier of the token being sent.
   * @param {number} amount Number of tokens being sent.
   * @return {*} List of ranges to use for the transaction.
   */
  async pickRanges (address, token, amount) {
    throw new Error('Not implemented')
  }

  /**
   * Determines if an account can spend an amount of a token.
   * @param {*} address An address
   * @param {*} token Identifier of the token being sent.
   * @param {*} amount Number of tokens being sent.
   * @return {boolean} `true` if the user can spend the tokens, `false` otherwise.
   */
  async canSpend (address, token, amount) {
    try {
      await this.pickRanges(address, token, amount)
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Adds a range for a given user.
   * @param {*} address An address.
   * @param {array} range A range to add.
   */
  async addRange (address, range) {
    await this.addRanges(address, [range])
  }

  /**
   * Adds ranges for a given user.
   * @param {*} address An address.
   * @param {*} ranges Ranges to add.
   */
  async addRanges (address, ranges) {
    // Throw if provided range is invalid
    if (ranges.some((range) => !isValidRange(range))) {
      throw new Error(`Invalid range provided: ${ranges}`)
    }

    let existing = (await this.getOwnedRanges(address)) || []

    // If there are no existing owned ranges,
    // just sort and add the new ranges
    if (existing.length === 0) {
      ranges.sort((a, b) => a[0] - b[0])
      return this.db.set(`ranges:${address}`, ranges)
    }

    ranges = ranges.concat(existing)
    ranges.sort((a, b) => a[0] - b[0])

    const nextRanges = ranges.reduce((nextRanges, newRange) => {
      if (nextRanges.length === 0) {
        return [newRange]
      }
      let lastRange = nextRanges.pop()
      return nextRanges.concat(orderRanges(lastRange, newRange))
    }, [])

    return this.db.set(`ranges:${address}`, nextRanges)
  }

  /**
   * Removes a range for a given user.
   * @param {*} address An address.
   * @param {*} range A range to remove.
   */
  async removeRange (address, range) {
    throw new Error('Not implemented')
  }
}

module.exports = RangeManagerService
