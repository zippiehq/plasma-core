const AsyncLock = require('async-lock')
const BigNum = require('bn.js')

const BaseService = require('../base-service')

// TODO: Maybe make these functions into static methods?
/**
 * Validates a range.
 * - Range start should be >= 0
 * - Range start should be < range end
 * @param {*} range A range object.
 * @return {boolean} `true` if the range is valid, `false` otherwise.
 */
function isValidRange (range) {
  // TODO: Check that the token is valid.
  return range.start.gte(0) && range.start.lt(range.end)
}

/**
 * Orders the provided ranges, collapsing them if possible
 * @param {*} rangeA A range object.
 * @param {*} rangeB A range object.
 * @return {array} array of ordered ranges
 */
function orderRanges (rangeA, rangeB) {
  // No curRange and new range comes before current range
  if (rangeA.end.lt(rangeB.start) || !rangeA.token.eq(rangeB.token)) {
    return [rangeA, rangeB]
  } else if (rangeA.start.eq(rangeB.end)) {
    // No curRange and new range start == current range end
    // merge to end of current range
    rangeB.end = rangeA.end
    return [rangeB]
  } else if (rangeA.end.eq(rangeB.start)) {
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
function containsRange (ranges, range) {
  return ranges.some((ownedRange) => {
    return (
      ownedRange.token.eq(range.token) &&
      ownedRange.start.lte(range.start) &&
      ownedRange.end.gte(range.end)
    )
  })
}

/**
 * Creates a range object
 * @param {String} token Tokens address.
 * @param {Number} start Range start.
 * @param {Number} end Range end.
 * @return {Range} Range object
 */
function createRange (token, start, end) {
  return {
    token: new BigNum(token, 'hex'),
    start: new BigNum(start, 'hex'),
    end: new BigNum(end, 'hex')
  }
}

/**
 * Service that manages the user's ranges automatically.
 */
class RangeManagerService extends BaseService {
  constructor (options) {
    super(options)
    this.lock = new AsyncLock()
  }

  get name () {
    return 'rangeManager'
  }

  /**
   * Returns the list of ranges owned by an address.
   * @param {string} address An address.
   * @return {Array} List of owned ranges.
   */
  async getOwnedRanges (address) {
    return this._getRanges(address)
  }

  async getOwnedTransfers (address) {
    return this._getTransfers(address)
  }

  /**
   * Returns a list of ranges relevant to a transaction.
   * @param {*} transaction A Transaction object.
   * @return {Array} List of ranges relevant to that transaction.
   */
  async getRelevantRanges (transaction) {
    let ranges = []
    for (let transfer of transaction.transfers) {
      ranges.concat(await this.getOwnedRanges(transfer.sender))
    }
    return ranges
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
    range = this._castRange(range)

    const ownedRanges = await this.getOwnedRanges(address)
    return containsRange(ownedRanges, range)
  }

  /**
   * Picks the best ranges for a given transaction.
   * @param {string} address An address.
   * @param {string} token A tokens address.
   * @param {number} amount Number of tokens being sent.
   * @return {*} List of ranges to use for the transaction.
   */
  async pickRanges (address, token, amount) {
    token = new BigNum(token, 'hex')
    amount = new BigNum(amount, 'hex')

    const ownedRanges = await this.getOwnedRanges(address)
    const sortedRanges = ownedRanges.sort((a, b) =>
      b.end.sub(b.start).sub(a.end.sub(a.start))
    )
    const pickedRanges = []

    while (amount.gt(new BigNum(0))) {
      // throw if no ranges left
      if (sortedRanges.length === 0) {
        throw new Error(
          'Address does not own enough ranges to cover the amount.'
        )
      }

      const smallestRange = sortedRanges.pop()

      if (smallestRange.token.eq(token)) {
        const smallestRangeLength = smallestRange.end.sub(smallestRange.start)

        if (smallestRangeLength.lte(amount)) {
          pickedRanges.push(smallestRange)
          amount = amount.sub(smallestRangeLength)
        } else {
          // Pick a partial range
          const partialRange = createRange(
            smallestRange.token,
            smallestRange.start,
            smallestRange.start.add(amount)
          )
          pickedRanges.push(partialRange)
          break
        }
      }
    }

    pickedRanges.sort((a, b) => a.start.sub(b.start))
    return pickedRanges
  }

  async pickTransfers (address, token, amount) {
    token = new BigNum(token, 'hex')
    amount = new BigNum(amount, 'hex')
    const ownedTransfers = await this.getOwnedTransfers(address)
    const transfers = ownedTransfers.filter((transfer) => {
      return transfer.token.eq(token)
    })
    const picked = []

    while (amount.gtn(0)) {
      // throw if no ranges left
      if (transfers.length === 0) {
        throw new Error(
          'Address does not have enough transfers to cover the exit.'
        )
      }

      const transfer = transfers.pop()
      const transferAmount = transfer.end.sub(transfer.start)

      if (transferAmount.lte(amount)) {
        picked.push(transfer)
        amount = amount.sub(transferAmount)
      } else {
        // Pick a partial range
        const partialRange = {
          ...transfer,
          ...{ end: transfer.start.add(amount) }
        }
        picked.push(partialRange)
        break
      }
    }

    picked.sort((a, b) => a.start.sub(b.start))
    return picked
  }

  /**
   * Determines if an account can spend an amount of a token.
   * @param {*} address An address
   * @param {string} token A tokens address.
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
   * @param {string} token A tokens address.
   * @param {*} ranges Ranges to add.
   */
  async addRanges (address, ranges) {
    return this.lock.acquire('ranges', () => {
      return this._addRanges(address, ranges)
    })
  }

  async _addTransfers (address, transfers) {
    let ownedTransfers = await this._getTransfers(address)
    ownedTransfers = ownedTransfers.concat(transfers)
    await this._setTransfers(address, ownedTransfers)
  }

  async _addRanges (address, ranges) {
    let transfers = ranges
    ranges = this._castRanges(ranges)

    // Throw if provided range is invalid
    if (ranges.some((range) => !isValidRange(range))) {
      throw new Error(`Invalid range provided: ${ranges}`)
    }

    const ownedRanges = (await this.getOwnedRanges(address)) || []

    // If there are no owned ranges,
    // just sort and add the new ranges
    ranges = ranges.concat(ownedRanges)
    ranges.sort((a, b) => {
      if (a.token.eq(b.token)) {
        return a.start.sub(b.start)
      } else {
        return a.token.sub(b.token)
      }
    })

    if (ownedRanges.length === 0) {
      await this._addTransfers(address, transfers)
      return this._setRanges(address, ranges)
    }

    const nextRanges = ranges.reduce((nextRanges, newRange) => {
      if (nextRanges.length === 0) {
        return [newRange]
      }
      const lastRange = nextRanges.pop()
      return nextRanges.concat(orderRanges(lastRange, newRange))
    }, [])

    await this._addTransfers(address, transfers)
    return this._setRanges(address, nextRanges)
  }

  /**
   * Removes a range for a given user.
   * @param {*} address An address.
   * @param {*} range A range to remove.
   */
  async removeRange (address, range) {
    return this.removeRanges(address, [range])
  }

  /**
   * Removes a sequence of ranges for a given user.
   * @param {*} address An address.
   * @param {*} ranges An array of ranges to remove.
   */
  async removeRanges (address, ranges) {
    return this.lock.acquire('ranges', () => {
      return this._removeRanges(address, ranges)
    })
  }

  async removeTransfers (address, transfers) {
    transfers = transfers.sort((a, b) => {
      return a.start.sub(b.start)
    })
    const ownedTransfers = await this._getTransfers(address)
    let newOwnedRanges = []
    ownedTransfers.forEach((owned, i) => {
      let nothingOverlaps = true
      transfers.forEach((transfer) => {
        const overlaps = transfer.token.eq(owned.token) &&
          (Math.max(transfer.start, owned.start) < Math.min(transfer.end, owned.end))
        if (overlaps) {
          nothingOverlaps = false
          if (owned.start.lt(transfer.start)) {
            newOwnedRanges.push({
              ...owned,
              ...{ end: transfer.start }
            })
          }
          if (owned.end.gt(transfer.end)) {
            newOwnedRanges.push({
              ...owned,
              ...{ start: transfer.end }
            })
          }
        }
      })
      if (nothingOverlaps) {
        newOwnedRanges.push(owned)
      }
    })
    await this._setTransfers(address, newOwnedRanges)
  }

  async _removeRanges (address, ranges) {
    let transfers = ranges
    ranges = this._castRanges(ranges)

    const ownedRanges = await this.getOwnedRanges(address)

    if (ranges.some((range) => !containsRange(ownedRanges, range))) {
      throw new Error(`Attempted to remove a range not owned by address.`)
    }

    ranges.sort((a, b) => {
      if (a.token.eq(b.token)) {
        return b.start.sub(a.start)
      } else {
        return b.token.sub(a.token)
      }
    })

    let toRemove = ranges.pop()
    const nextRanges = ownedRanges.reduce((nextRanges, ownedRange) => {
      if (!toRemove) {
        // All ranges removed already
        nextRanges.push(ownedRange)
      } else if (
        ownedRange.start.eq(toRemove.start) &&
        ownedRange.end.eq(toRemove.end) &&
        ownedRange.token.eq(toRemove.token)
      ) {
        // Remove this range
        toRemove = ranges.pop()
      } else if (
        ownedRange.start.lt(toRemove.start) &&
        ownedRange.end.gt(toRemove.end) &&
        ownedRange.token.eq(toRemove.token)
      ) {
        // This range contains the range to remove
        nextRanges = nextRanges.concat([
          createRange(ownedRange.token, ownedRange.start, toRemove.start),
          createRange(ownedRange.token, toRemove.end, ownedRange.end)
        ])
        toRemove = ranges.pop()
      } else if (
        ownedRange.start.eq(toRemove.start) &&
        ownedRange.end.gt(toRemove.end) &&
        ownedRange.token.eq(toRemove.token)
      ) {
        // Remove front of a range
        nextRanges.push(
          createRange(ownedRange.token, toRemove.end, ownedRange.end)
        )
        toRemove = ranges.pop()
      } else if (
        ownedRange.start.lt(toRemove.start) &&
        ownedRange.end.eq(toRemove.end) &&
        ownedRange.token.eq(toRemove.token)
      ) {
        // Remove end of a range
        nextRanges.push(
          createRange(ownedRange.token, ownedRange.start, toRemove.start)
        )
        toRemove = ranges.pop()
      } else {
        nextRanges.push(ownedRange)
      }
      return nextRanges
    }, [])

    await this.removeTransfers(address, transfers)
    return this._setRanges(address, nextRanges)
  }

  async _setRanges (address, ranges) {
    return this.services.db.set(`ranges:${address}`, ranges)
  }

  async _getRanges (address) {
    return this._castRanges(await this.services.db.get(`ranges:${address}`, []))
  }

  async _setTransfers (address, transfers) {
    transfers = transfers.sort((a, b) => {
      if (a.token.lt(b.token)) {
        return -1
      }
      return a.start.sub(b.start)
    })
    return this.services.db.set(`transfers:${address}`, transfers)
  }

  async _getTransfers (address) {
    return this._castTransfers(await this.services.db.get(`transfers:${address}`, []))
  }

  async addExits (address, exits) {
    let ownedExits = await this.getExits(address)
    ownedExits = ownedExits.concat(exits)
    await this.setExits(address, ownedExits)
  }

  async removeExits (address, exits) {
    exits = this._castTransfers(exits)
    let ownedExits = await this.getExits(address)
    let newExits = []
    for (let owned of ownedExits) {
      let seen = false
      for (let exit of exits) {
        if (exit.id.eq(owned.id)) {
          seen = true
        }
      }
      if (!seen) {
        newExits.push(owned)
      }
    }
    await this.setExits(address, newExits)
  }

  async setExits (address, exits) {
    exits = exits.sort((a, b) => {
      if (a.token.lt(b.token)) {
        return -1
      }
      return a.start.sub(b.start)
    })
    return this.services.db.set(`exits:${address}`, exits)
  }

  async getExits (address) {
    return this._castTransfers(await this.services.db.get(`exits:${address}`, []))
  }

  _castRanges (ranges) {
    return ranges.map(this._castRange.bind(this))
  }

  _castRange (range) {
    return {
      start: new BigNum(range.start, 'hex'),
      end: new BigNum(range.end, 'hex'),
      token: new BigNum(range.token, 'hex')
    }
  }

  _castTransfers (transfers) {
    return transfers.map(this._castTransfer.bind(this))
  }

  _castTransfer (transfer) {
    return {
      start: new BigNum(transfer.start, 'hex'),
      end: new BigNum(transfer.end, 'hex'),
      token: new BigNum(transfer.token, 'hex'),
      block: new BigNum(transfer.block, 'hex'),
      id: new BigNum(transfer.id || 0, 'hex')
    }
  }

  _transfersEqual (a, b) {
    return (
      a.start.eq(b.start) &&
      a.end.eq(b.end) &&
      a.token.eq(b.token) &&
      a.block.eq(b.block)
    )
  }
}

module.exports = RangeManagerService
