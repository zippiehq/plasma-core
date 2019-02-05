const BigNum = require('bn.js')

/**
 * Validates a transfer.
 * - Transfer start should be >= 0
 * - Transfer start should be < transfer end
 * @param {Transfer} transfer A transfer object.
 * @return {boolean} `true` if the transfer is valid, `false` otherwise.
 */
function isValidTransfer (transfer) {
  // TODO: Check that the token is valid.
  return transfer.start.gte(0) && transfer.start.lt(transfer.end)
}

/**
 * Orders the provided ranges, collapsing them if possible
 * @param {Range} rangeA A Range object.
 * @param {Range} rangeB A Range object.
 * @return {Array<Range>} Array of ordered ranges.
 */
function orderRanges (rangeA, rangeB) {
  if (rangeA.token.lt(rangeB.token) ||
      rangeA.end.lt(rangeB.start)) {
    return [rangeA, rangeB]
  } else if (rangeA.start.eq(rangeB.end)) {
    rangeB.end = rangeA.end
    return [rangeB]
  } else if (rangeA.end.eq(rangeB.start)) {
    rangeB.start = rangeA.start
    return [rangeB]
  } else {
    return [rangeB, rangeA]
  }
}

/**
 * Sorts a list of transfers by token and then by start.
 * @param {Array<Transfers>} transfers A list of transfers to sort.
 * @return {Array<Transfers>} A sorted list of transfers.
 */
function sortTransfers (transfers) {
  transfers.sort((a, b) => {
    if (!a.token.eq(b.token)) {
      return a.token.sub(b.token)
    } else {
      return a.start.sub(b.start)
    }
  })
  return transfers
}

/**
 * Checks is an array of transfers contains another transfer
 * @param {Array<Transfer>} transfers An array of transfers to check.
 * @param {Transfer} transfer A transfer object.
 * @return {boolean} `true` if the user owns the transfer, `false` otherwise.
 */
function containsTransfer (transfers, transfer) {
  return transfers.some((ownedTransfer) => {
    return (
      ownedTransfer.block.eq(transfer.block) &&
      ownedTransfer.token.eq(transfer.token) &&
      ownedTransfer.start.lte(transfer.start) &&
      ownedTransfer.end.gte(transfer.end)
    )
  })
}

/**
 * Service that manages the user's transfers automatically.
 */
class TransferManager {
  constructor () {
    this.transfers = {}
  }

  /**
   * Returns the list of transfers owned by an address.
   * @param {string} address An address.
   * @return {Array<Transfer>} A sorted list of owned transfers.
   */
  getOwnedTransfers (address) {
    const ownedTransfers = this._getTransfers(address)
    return sortTransfers(ownedTransfers)
  }

  /**
   * Returns the list of ranges owned by an address.
   * @param {string} address An address.
   * @return {Array<Range>} A sorted list of owned ranges.
   */
  getOwnedRanges (address) {
    const ownedTransfers = this.getOwnedTransfers(address)
    const ownedRanges = ownedTransfers.reduce((ranges, transfer) => {
      const range = this._castRange(transfer)
      if (ranges.length === 0) {
        return [range]
      }
      const lastRange = ranges.pop()
      return ranges.concat(orderRanges(lastRange, range))
    }, [])
    return ownedRanges
  }

  /**
   * Determines if an address owners a specific transfer.
   * i.e. if a user owns transfer [0, 100] and this method is
   * called with [10, 30], it will return true.
   * @param {string} address An address.
   * @param {Transfer} transfer A transfer object.
   * @return {boolean} `true` if the user owns the transfer, `false` otherwise.
   */
  ownsTransfer (address, transfer) {
    transfer = this._castTransfer(transfer)
    const ownedTransfers = this.getOwnedTransfers(address)
    return containsTransfer(ownedTransfers, transfer)
  }

  /**
   * Picks transfers that cover a given amount.
   * @param {string} address An address.
   * @param {string} token A tokens address.
   * @param {number} amount Number of tokens being sent.
   * @return {Array<Transfer>} List of transfers to use for the transaction.
   */
  pickTransfers (address, token, amount) {
    const ownedTransfers = this.getOwnedTransfers(address)
    return this._pickElements(ownedTransfers, token, amount)
  }

  /**
   * Picks the best ranges for a given transaction.
   * @param {string} address An address.
   * @param {string} token A tokens address.
   * @param {number} amount Number of tokens being sent.
   * @return {Array<Range>} List of ranges to use for the transaction.
   */
  pickRanges (address, token, amount) {
    const ownedRanges = this.getOwnedRanges(address)
    return this._pickElements(ownedRanges, token, amount)
  }

  /**
   * Picks elements from a list that cover a given amount.
   * @param {Array<Range>|Array<Transfer>} arr List to pick from.
   * @param {string} token A tokens address.
   * @param {number} amount Number of tokens being sent.
   * @return {Array<Range>} List of ranges to use for the transaction.
   */
  _pickElements (arr, token, amount) {
    token = new BigNum(token, 'hex')
    amount = new BigNum(amount, 'hex')

    const available = arr.filter((transfer) => {
      return transfer.token.eq(token)
    }).sort((a, b) => {
      return b.end.sub(b.start).sub(a.end.sub(a.start))
    })
    const picked = []

    while (amount.gtn(0)) {
      if (available.length === 0) {
        throw new Error(
          'Address does not own enough transfers to cover the amount.'
        )
      }

      const smallest = available.pop()
      const smallestAmount = smallest.end.sub(smallest.start)

      if (smallestAmount.lte(amount)) {
        picked.push(smallest)
        amount = amount.sub(smallestAmount)
      } else {
        // NOW: Rip. How do I exit partial stuff?
        picked.push({
          ...smallest,
          ...{ end: smallest.start.add(amount) }
        })
        break
      }
    }

    return sortTransfers(picked)
  }

  /**
   * Determines if an account can spend an amount of a token.
   * @param {string} address An address.
   * @param {string} token A tokens address.
   * @param {string} amount Number of tokens being sent.
   * @return {boolean} `true` if the user can spend the tokens, `false` otherwise.
   */
  canSpend (address, token, amount) {
    try {
      this.pickTransfers(address, token, amount)
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Adds a transfer for a given user.
   * @param {string} address An address.
   * @param {Array<Transfer>} transfer A transfer to add.
   */
  addTransfer (address, transfer) {
    this.addTransfers(address, [transfer])
  }

  /**
   * Adds transfers for a given user.
   * @param {string} address An address.
   * @param {Array<Transfer>} transfers Transfers to add.
   */
  addTransfers (address, transfers) {
    transfers = this._castTransfers(transfers)

    // Throw if provided transfer is invalid.
    if (transfers.some((transfer) => !isValidTransfer(transfer))) {
      throw new Error(`Invalid transfer provided: ${transfers}`)
    }

    const ownedTransfers = this.getOwnedTransfers(address)

    // Add the new transfers to the existing transfers and sort them.
    transfers = transfers.concat(ownedTransfers)
    transfers = sortTransfers(transfers)

    this._setTransfers(address, transfers)
  }

  /**
   * Removes a transfer for a given user.
   * @param {string} address An address.
   * @param {Transfer} transfer A transfer to remove.
   */
  removeTransfer (address, transfer) {
    this.removeTransfers(address, [transfer])
  }

  /**
   * Removes a sequence of transfers for a given user.
   * @param {string} address An address.
   * @param {Array<Transfer>} transfers An array of transfers to remove.
   */
  removeTransfers (address, transfers) {
    transfers = this._castTransfers(transfers)

    // Filter out the transfers to be removed from those owned.
    const ownedTransfers = this.getOwnedTransfers(address)
    let newOwnedTransfers = []
    ownedTransfers.forEach((owned, i) => {
      let nothingOverlaps = true
      transfers.forEach((transfer) => {
        const overlaps = transfer.token.eq(owned.token) &&
          (Math.max(transfer.start, owned.start) < Math.min(transfer.end, owned.end))
        if (overlaps) {
          nothingOverlaps = false
          if (owned.start.lt(transfer.start)) {
            newOwnedTransfers.push({
              ...owned,
              ...{ end: transfer.start }
            })
          }
          if (owned.end.gt(transfer.end)) {
            newOwnedTransfers.push({
              ...owned,
              ...{ start: transfer.end }
            })
          }
        }
      })
      if (nothingOverlaps) {
        newOwnedTransfers.push(owned)
      }
    })

    return this._setTransfers(address, newOwnedTransfers)
  }

  _setTransfers (address, transfers) {
    this.transfers[address] = transfers
  }

  _getTransfers (address) {
    return this._castTransfers(this.transfers[address] || [])
  }

  _castTransfers (transfers) {
    return transfers.map(this._castTransfer.bind(this))
  }

  _castTransfer (transfer) {
    return {
      start: new BigNum(transfer.start, 'hex'),
      end: new BigNum(transfer.end, 'hex'),
      token: new BigNum(transfer.token, 'hex'),
      block: new BigNum(transfer.block, 'hex')
    }
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
}

module.exports = TransferManager
