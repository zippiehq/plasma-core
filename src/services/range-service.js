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
 * Service that manages the user's ranges automatically.
 */
class RangeManagerService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
    this.db = this.app.services.db
  }

  get name () {
    return 'range'
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

    // Sort provided ranges by start
    ranges.sort((a, b) => a.start - b.start)

    let existing = (await this.getOwnedRanges(address)) || []

    let curRange

    let newRange

    let nextRanges = []

    // Insert + collapse ranges
    let j = 0
    for (let i = 0; i < existing.length; i++) {
      // All new ranges have been inserted
      // append existing and break
      if (j === ranges.length) {
        nextRanges = nextRanges.concat(existing.slice(i))
        break
      }

      curRange = existing[i]
      newRange = ranges[j]

      // New range comes before current range
      if (newRange[1] < curRange[0]) {
        nextRanges.push(newRange)
        nextRanges.push(curRange)
        j++
        continue
      } else if (newRange[0] === curRange[1]) {
        // If new range start == current range end
        // merge to end of current range
        curRange[1] = newRange[1]

        // Peek at next range to see if
        // new range end == next range start
        // i.e. the new range spans two existing
        // ranges so we can collapse all three into one
        if (!!existing[i + 1] && newRange[1] === existing[i + 1][0]) {
          curRange[1] = existing[i + 1][1]
          i++
        }

        nextRanges.push(curRange)
        j++
        continue
      } else if (newRange[1] === curRange[0]) {
        // If new range end == current range start
        // merge to front of current range
        curRange[0] = newRange[0]
        nextRanges.push(curRange)
        j++
        continue
      } else {
        // New range start is greater than
        // next range start, keep looking...
        nextRanges.push(curRange)
        continue
      }
    }

    // If there are no more existing ranges to
    // check, append all remaining new ranges
    if (j < ranges.length) {
      nextRanges = nextRanges.concat(ranges.slice(j))
    }

    await this.db.set(`ranges:${address}`, nextRanges)
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
