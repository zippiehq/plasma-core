const BaseService = require('./base-service')

/**
 * Validates a range.
 * - Range start should be >= 0
 * - Range start should be < range end
 * @param {*} range A range object.
 * @return {boolean} `true` if the range is valid, `false` otherwise.
 */
function isValidRange ({ start, end }) {
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
  if (rangeA.end < rangeB.start) {
    return [rangeA, rangeB]
  } else if (rangeA.start === rangeB.end) {
    // No curRange and new range start == current range end
    // merge to end of current range
    rangeB.end = rangeA.end
    return [rangeB]
  } else if (rangeA.end === rangeB.start) {
    // If new range end == current range start
    // merge to front of current range
    rangeB.start = rangeA.start
    return [rangeB]
  } else {
    return [rangeB, rangeA]
  }
}

/**
 * Checks is an array of ranges contains another range
 * @param {array} ranges An array of ranges to check.
 * @param {*} range A range object.
 * @return {boolean} `true` if the user owns the range, `false` otherwise.
 */
function containsRange (ranges, { start, end }) {
  return ranges.some(
    ({ start: ownedRangeStart, end: ownedRangeEnd }) =>
      ownedRangeStart <= start && ownedRangeEnd >= end
  )
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
    return containsRange(ownedRanges, range)
  }

  /**
   * Picks the best ranges for a given transaction.
   * @param {string} address An address.
   * @param {number} amount Number of tokens being sent.
   * @return {*} List of ranges to use for the transaction.
   */
  async pickRanges (address, amount) {
    const ownedRanges = await this.getOwnedRanges(address)
    const sortedRanges = ownedRanges.sort(
      (a, b) => b.end - b.start - (a.end - a.start)
    )
    const pickedRanges = []

    while (amount > 0) {
      // throw if no ranges left
      if (sortedRanges.length === 0) {
        throw new Error(
          'Address does not own enough ranges to cover the amount.'
        )
      }

      const smallestRange = sortedRanges.pop()
      const smallestRangeLength = smallestRange.end - smallestRange.start

      if (smallestRangeLength <= amount) {
        pickedRanges.push(smallestRange)
        amount -= smallestRangeLength
      } else {
        // Pick a partial range
        const partialRange = {
          start: smallestRange.start,
          end: smallestRange.start + amount
        }
        pickedRanges.push(partialRange)
        break
      }
    }

    pickedRanges.sort((a, b) => a.start - b.start)
    return pickedRanges
  }

  /**
   * Determines if an account can spend an amount of a token.
   * @param {*} address An address
   * @param {*} amount Number of tokens being sent.
   * @return {boolean} `true` if the user can spend the tokens, `false` otherwise.
   */
  async canSpend (address, amount) {
    try {
      await this.pickRanges(address, amount)
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

    const ownedRanges = (await this.getOwnedRanges(address)) || []

    // If there are no owned ranges,
    // just sort and add the new ranges
    if (ownedRanges.length === 0) {
      ranges.sort((a, b) => a.start - b.start)
      return this.db.set(`ranges:${address}`, ranges)
    }

    ranges = ranges.concat(ownedRanges)
    ranges.sort((a, b) => a.start - b.start)

    const nextRanges = ranges.reduce((nextRanges, newRange) => {
      if (nextRanges.length === 0) {
        return [newRange]
      }
      const lastRange = nextRanges.pop()
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
    this.removeRanges(address, [range])
  }

  /**
   * Removes a sequence of ranges for a given user.
   * @param {*} address An address.
   * @param {*} range An array of ranges to remove.
   */
  async removeRanges (address, ranges) {
    const ownedRanges = await this.getOwnedRanges(address)

    if (ranges.some((range) => !containsRange(ownedRanges, range))) {
      throw new Error(`Attempted to remove a range not owned by address.`)
    }

    ranges.sort((a, b) => b.start - a.start)

    let toRemove = ranges.pop()
    const nextRanges = ownedRanges.reduce((nextRanges, ownedRange) => {
      if (!toRemove) {
        // All ranges removed already
        nextRanges.push(ownedRange)
      } else if (
        ownedRange.start === toRemove.start &&
        ownedRange.end === toRemove.end
      ) {
        // Remove this range
        toRemove = ranges.pop()
      } else if (
        ownedRange.start < toRemove.start &&
        ownedRange.end > toRemove.end
      ) {
        // This range contains the range to remove
        nextRanges = nextRanges.concat([
          { start: ownedRange.start, end: toRemove.start },
          { start: toRemove.end, end: ownedRange.end }
        ])
        toRemove = ranges.pop()
      } else if (
        ownedRange.start === toRemove.start &&
        ownedRange.end > toRemove.end
      ) {
        // Remove front of a range
        nextRanges.push({ start: toRemove.end, end: ownedRange.end })
        toRemove = ranges.pop()
      } else if (
        ownedRange.start < toRemove.start &&
        ownedRange.end === toRemove.end
      ) {
        // Remove end of a range
        nextRanges.push({ start: ownedRange.start, end: toRemove.start })
        toRemove = ranges.pop()
      } else {
        nextRanges.push(ownedRange)
      }
      return nextRanges
    }, [])

    return this.db.set(`ranges:${address}`, nextRanges)
  }
}

module.exports = RangeManagerService
