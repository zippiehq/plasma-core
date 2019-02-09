const _ = require('lodash')
const BigNum = require('bn.js')
const utils = require('plasma-utils')
const debug = require('debug')
const models = utils.serialization.models
const Transfer = models.Transfer

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Pulls out the token from a typed value.
 * @param {BigNum} typedValue A typed value.
 * @return {BigNum} The token.
 */
const getTokenFromTyped = (typedValue) => {
  const typed = typedValue.toString('hex', '32')
  const token = new BigNum(typed.slice(0, 8), 'hex')
  return token
}

/**
 * Pulls out the value from a typed value.
 * @param {BigNum} typedValue A typed value.
 * @return {BigNum} The value.
 */
const getValueFromTyped = (typedValue) => {
  const typed = typedValue.toString('hex', '32')
  const value = new BigNum(typed.slice(8, 32), 'hex')
  return value
}

/**
 * Base class that allows for printing objects in a prettified manner.
 */
class PrettyPrint {
  /**
   * Returns the object as a pretty JSON string.
   * Converts BigNums to decimal strings.
   * @return {string} JSON string.
   */
  prettify () {
    const parsed = {}
    Object.keys(this).forEach((key) => {
      const value = this[key]
      if (BigNum.isBN(value)) {
        parsed[key] = value.toString(10)
      } else {
        parsed[key] = value
      }
    })
    return JSON.stringify(parsed, null, 2)
  }
}

/**
 * Represents a single state component ("snapshot").
 */
class Snapshot extends PrettyPrint {
  constructor (snapshot) {
    super()

    this.start = new BigNum(snapshot.start, 'hex')
    this.end = new BigNum(snapshot.end, 'hex')
    this.block = new BigNum(snapshot.block, 'hex')
    this.owner = snapshot.owner
  }

  /**
   * Determines if the snapshot is valid.
   * @return {boolean} `true` if the snapshot is valid, `false` otherwise.
   */
  get valid () {
    return this.start.lt(this.end) && this.block.gte(0)
  }

  /**
   * Checks if this snapshot equals another.
   * @param {Snapshot} other Other snapshot.
   * @return {boolean} `true` if the two are equal, `false` otherwise.
   */
  equals (other) {
    return (
      this.start.eq(other.start) &&
      this.end.eq(other.end) &&
      this.block.eq(other.block) &&
      this.owner === other.owner
    )
  }

  /**
   * Checks if this snapshot contains another.
   * @param {Snapshot} other Other snapshot.
   * @return {boolean} `true` if this contains the other, `false` otherwise.
   */
  contains (other) {
    return (
      this.start.lte(other.start) &&
      this.end.gte(other.end) &&
      this.block.eq(other.block) &&
      this.owner === other.owner
    )
  }

  /**
   * Creates a Snapshot from a Transfer.
   * @param {Transfer} transfer A Transfer object.
   * @return {Snapshot} The snapshot object.
   */
  static fromTransfer (transfer) {
    const serialized = new Transfer(transfer)

    return new Snapshot({
      start: serialized.typedStart,
      end: serialized.typedEnd,
      owner: serialized.recipient,
      block: transfer.block
    })
  }

  /**
   * Creates a Snapshot from a Deposit.
   * @param {Deposit} deposit A Deposit object.
   * @return {Snapshot} The snapshot object.
   */
  static fromDeposit (deposit) {
    return Snapshot.fromTransfer({
      ...deposit,
      ...{
        sender: NULL_ADDRESS,
        recipient: deposit.owner
      }
    })
  }

  /**
   * Creates a Snapshot from an Exit.
   * @param {Exit} exit An Exit object.
   * @return {Snapshot} The snapshot object.
   */
  static fromExit (exit) {
    return Snapshot.fromTransfer({
      ...exit,
      ...{
        sender: exit.exiter,
        recipient: NULL_ADDRESS
      }
    })
  }
}

/**
 * Version of Snapshot that uses untyped (token/value) values.
 */
class UntypedSnapshot extends PrettyPrint {
  constructor (snapshot) {
    super()

    this.token = new BigNum(snapshot.token, 'hex')
    this.start = new BigNum(snapshot.start, 'hex')
    this.end = new BigNum(snapshot.end, 'hex')
    this.block = new BigNum(snapshot.block, 'hex')
    this.owner = snapshot.owner
  }

  /**
   * Creates an UntypedSnapshot from a Snapshot.
   * @param {Snapshot} snapshot A Snapshot object.
   * @return {UntypedSnapshot} The UntypedSnapshot object.
   */
  static fromSnapshot (snapshot) {
    return new UntypedSnapshot({
      ...snapshot,
      ...{
        token: getTokenFromTyped(snapshot.start),
        start: getValueFromTyped(snapshot.start),
        end: getValueFromTyped(snapshot.end)
      }
    })
  }
}

/**
 * Represents a simplified state component ("range").
 */
class Range extends PrettyPrint {
  constructor (range) {
    super()

    this.token = new BigNum(range.token, 'hex')
    this.start = new BigNum(range.start, 'hex')
    this.end = new BigNum(range.end, 'hex')
    this.owner = range.owner
  }

  /**
   * Creates a Range from a Snapshot.
   * @param {Snapshot} snapshot A Snapshot object.
   * @return {Range} The range object.
   */
  static fromSnapshot (snapshot) {
    const untyped = UntypedSnapshot.fromSnapshot(snapshot)
    return new Range(untyped)
  }
}

/**
 * Represents an implicit or explicit piece of a transfer.
 */
class TransferComponent extends PrettyPrint {
  constructor (transfer) {
    super()

    this.start = new BigNum(transfer.start, 'hex')
    this.end = new BigNum(transfer.end, 'hex')
    this.block = new BigNum(transfer.block, 'hex')
    this.sender = transfer.sender
    this.recipient = transfer.recipient
    this.implicit = transfer.implicit || false
  }
}

/**
 * Utility class that manages state transitions.
 */
class SnapshotManager {
  constructor (snapshots = []) {
    this.snapshots = snapshots.map((snapshot) => {
      return new Snapshot(snapshot)
    })
    this.debug = debug('debug:snapshots')
  }

  /**
   * Returns a copy of the head state.
   * @return {Array<Snapshot>} The head state.
   */
  get state () {
    return _.cloneDeep(this.snapshots)
  }

  /**
   * Returns a list of ranges in the head state.
   * @return {Array<Range>} List of ranges.
   */
  get ranges () {
    const ranges = this.snapshots.map((snapshot) => {
      return Range.fromSnapshot(snapshot)
    })
    return this._mergeRanges(ranges)
  }

  /**
   * Merges the state of another SnapshotManager into this one.
   * @param {SnapshotManager} other Other manager.
   */
  merge (other) {
    this.debug('Merging snapshots')
    for (const snapshot of other.state) {
      try {
        this._addSnapshot(snapshot)
      } catch (err) {
        // TODO: Handle errors here? They don't really break anything.
      }
    }
  }

  /**
   * Returns a list of ranges owned by a specific address.
   * @param {string} address Address to query.
   * @return {Array<Range>} List of owned ranges.
   */
  getOwnedRanges (address) {
    return this.ranges.filter((range) => {
      return range.owner === address
    })
  }

  /**
   * Returns a list of snapshots owned by a specific address.
   * @param {string} address Address to query.
   * @return {Array<UntypedSnapshot>} List of owned snapshots.
   */
  getOwnedSnapshots (address) {
    return this.snapshots
      .map((snapshot) => {
        return UntypedSnapshot.fromSnapshot(snapshot)
      })
      .filter((snapshot) => {
        return snapshot.owner === address
      })
  }

  /**
   * Picks snapshots that cover a given amount.
   * @param {string} address An address.
   * @param {string} token A token address.
   * @param {number} amount Number of tokens being sent.
   * @return {Array<Snapshot>} List of snapshots.
   */
  pickSnapshots (address, token, amount) {
    const ownedTransfers = this.getOwnedSnapshots(address)
    return this._pickElements(ownedTransfers, token, amount)
  }

  /**
   * Picks the best ranges for a given transaction.
   * @param {string} address An address.
   * @param {string} token A token address.
   * @param {number} amount Number of tokens being sent.
   * @return {Array<Range>} List of ranges to use for the transaction.
   */
  pickRanges (address, token, amount) {
    const ownedRanges = this.getOwnedRanges(address)
    return this._pickElements(ownedRanges, token, amount)
  }

  /**
   * Checks if a transaction would be valid given the local state.
   * @param {Transaction} transaction A Transaction object.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  validateTransaction (transaction) {
    return transaction.transfers.every((transfer) => {
      const snapshot = Snapshot.fromTransfer({
        ...transfer,
        ...{ block: transaction.block }
      })
      return this._hasSnapshot(snapshot) && snapshot.valid
    })
  }

  /**
   * Applies a Deposit to the local state.
   * @param {Deposit} deposit Deposit to apply.
   */
  applyDeposit (deposit) {
    const snapshot = Snapshot.fromDeposit(deposit)
    this._addSnapshot(snapshot)
  }

  /**
   * Applies an Exit to the local state.
   * @param {Exit} exit Exit to apply.
   */
  applyExit (exit) {
    const snapshot = Snapshot.fromExit(exit)
    this._addSnapshot(snapshot)
  }

  /**
   * Applies a sent transaction to the local state.
   * This is a special case because we don't actually care
   * if the state transition is valid when sending transactions.
   * @param {Transaction} transaction Transaction to apply.
   */
  applySentTransaction (transaction) {
    const snapshots = transaction.transfers.map((transfer) => {
      return Snapshot.fromTransfer({
        ...transfer,
        ...{
          block: transaction.block
        }
      })
    })

    for (const snapshot of snapshots) {
      this._addSnapshot(snapshot)
    }
  }

  /**
   * Applies an empty block.
   * @param {number} block The block number.
   */
  applyEmptyBlock (block) {
    this.debug(`Applying empty block: ${block.toString(10)}`)
    for (let snapshot of this.snapshots) {
      if (snapshot.block.addn(1).eq(block)) {
        snapshot.block = snapshot.block.addn(1)
      }
    }
  }

  /**
   * Applies a Transaction to the local state.
   * @param {Transaction} transaction Transaction to apply.
   */
  applyTransaction (transaction) {
    // Pull out all of the transfer components (implicit and explicit).
    const components = transaction.transfers.reduce((components, transfer) => {
      return components.concat(
        this._getTransferComponents({
          ...transfer,
          ...{ block: transaction.block }
        })
      )
    }, [])

    for (const component of components) {
      this._applyTransferComponent(component)
    }
  }

  /**
   * Applies a single TransferComponent to the local state.
   * @param {TransferComponent} component Component to apply.
   */
  _applyTransferComponent (component) {
    this.debug(`Applying transaction component: ${component.prettify()}`)

    // Determine which snapshots overlap with this component.
    const overlapping = this.snapshots.filter((snapshot) => {
      return (
        Math.max(snapshot.start, component.start) <
        Math.min(snapshot.end, component.end)
      )
    })

    // Apply this component to each snapshot that it overlaps.
    for (const snapshot of overlapping) {
      if (!this._validStateTransition(snapshot, component)) {
        continue
      }

      // Remove the old snapshot.
      this._removeSnapshot(snapshot)

      // Insert any newly created snapshots.
      if (snapshot.start.lt(component.start)) {
        this._addSnapshot(
          new Snapshot({
            ...snapshot,
            ...{ end: component.start }
          })
        )
      }
      if (snapshot.end.gt(component.end)) {
        this._addSnapshot(
          new Snapshot({
            ...snapshot,
            ...{ start: component.end }
          })
        )
      }
      this._addSnapshot(
        new Snapshot({
          start: Math.max(snapshot.start, component.start),
          end: Math.min(snapshot.end, component.end),
          block: component.block,
          owner: component.implicit ? snapshot.owner : component.recipient
        })
      )
    }
  }

  /**
   * Inserts a snapshot into the local store of snapshots.
   * @param {Snapshot} snapshot Snapshot to insert.
   */
  _addSnapshot (snapshot) {
    if (!snapshot.valid) {
      throw new Error('Invalid snapshot')
    }
    this.debug(`Adding snapshot: ${snapshot.prettify()}`)

    this.snapshots.push(snapshot)
    this.snapshots.sort((a, b) => {
      return a.start.sub(b.start)
    })
    this.snapshots = this._removeOverlapping(this.snapshots)
    this.snapshots = this._mergeSnapshots(this.snapshots)
  }

  /**
   * Removes a snapshot from the local store of snapshots.
   * @param {Snapshot} snapshot Snapshot to remove.
   */
  _removeSnapshot (snapshot) {
    this.snapshots = this.snapshots.filter((existing) => {
      return !existing.equals(snapshot)
    })
  }

  /**
   * Merges and reduces a list of snapshots.
   * Combines any snapshots that share the same start or end
   * and also share the same block number and owner.
   * @param {Array<Snapshot>} snapshots A list of Snapshot objects.
   * @return {Array<Snapshot>} The merged list of Snapshot objects.
   */
  _mergeSnapshots (snapshots) {
    const merged = []

    snapshots.forEach((snapshot) => {
      let left, right
      merged.forEach((s, i) => {
        if (!s.block.eq(snapshot.block) || s.owner !== snapshot.owner) {
          return
        }

        if (s.end.eq(snapshot.start)) {
          left = i
        }
        if (s.start.eq(snapshot.end)) {
          right = i
        }
      })

      if (left !== undefined) {
        merged[left].end = snapshot.end
      }
      if (right !== undefined) {
        merged[right].start = snapshot.start
      }
      if (left === undefined && right === undefined) {
        merged.push(snapshot)
      }
    })

    return merged
  }

  /**
   * Removes any overlapping snapshots by giving preference to the later snapshot.
   * @param {Array<Snapshot>} snapshots A list of snapshots.
   * @return {Array<Snapshot>} The list with overlapping snapshots resolved.
   */
  _removeOverlapping (snapshots) {
    // Sort by start, then end.
    snapshots.sort((a, b) => {
      if (!a.start.eq(b.start)) {
        return a.start.sub(b.start)
      } else {
        return a.end.sub(b.end)
      }
    })

    // Clear up any overlap by picking the snapshot with the greatest block.
    let reduced = []
    for (let s of snapshots) {
      // Catches overlap since we've sorted by start and end.
      const overlapping = reduced.filter((r) => {
        return s.start.lt(r.end)
      })

      // Break up overlapping components.
      let remainder = true
      for (let r of overlapping) {
        if (s.block.gte(r.block)) {
          // New snapshot comes after old one, so overwrite.

          // Remove the old snapshot.
          reduced = reduced.filter((el) => {
            return !el.equals(r)
          })

          // Add any of the old snapshot that didn't overlap.
          if (r.start.lt(s.start)) {
            reduced.push(
              new Snapshot({
                ...r,
                ...{ end: s.start }
              })
            )
          }
          if (r.end.gt(s.end)) {
            reduced.push(
              new Snapshot({
                ...r,
                ...{ start: s.end }
              })
            )
          }

          // Add the new overlapping part.
          reduced.push(
            new Snapshot({
              ...s,
              ...{ end: Math.min(s.end, r.end) }
            })
          )
        }

        if (s.end.gt(r.end)) {
          // Repeat the process with the part that didn't overlap.
          s = new Snapshot({
            ...s,
            ...{ start: r.end }
          })
        } else {
          // Everything overlapped, so there's no remainder.
          remainder = false
          break
        }
      }

      // Add any remainder.
      if (remainder) {
        reduced.push(s)
      }
    }

    return reduced
  }

  /**
   * Merges and reduces a list of ranges.
   * Combines any ranges that share the same start or end
   * and also share the same owner.
   * @param {Array<Range>} ranges A list of Range objects.
   * @return {Array<Range>} The merged list of Range objects.
   */
  _mergeRanges (ranges) {
    const orderRanges = (rangeA, rangeB) => {
      if (rangeA.owner !== rangeB.owner || rangeA.end.lt(rangeB.start)) {
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

    // Sort by address and then by start.
    ranges.sort((a, b) => {
      if (a.owner !== b.owner) {
        return a.owner - b.owner
      } else {
        return a.start.sub(b.start)
      }
    })

    return ranges.reduce((merged, range) => {
      if (merged.length === 0) return [range]
      const lastRange = merged.pop()
      return merged.concat(orderRanges(lastRange, range))
    }, [])
  }

  /**
   * Determines if the local state contains a specific snapshot.
   * @param {Snapshot} snapshot A Snapshot object.
   * @return {boolean} `true` if the state contains the snapshot, `false` otherwise.
   */
  _hasSnapshot (snapshot) {
    return this.snapshots.some((existing) => {
      return existing.contains(snapshot)
    })
  }

  /**
   * Checks whether a transfer is a valid state transition from an existing snapshot.
   * @param {Snapshot} snapshot Existing snapshot object.
   * @param {TransferComponent} transfer Transfer from one user to another.
   * @return {boolean} `true` if the transition is valid, `false` otherwise.
   */
  _validStateTransition (snapshot, transfer) {
    const validSender = transfer.implicit || snapshot.owner === transfer.sender
    const validBlock = snapshot.block.addn(1).eq(transfer.block)
    return validSender && validBlock
  }

  /**
   * Break down the list of TransferComponents that make up a Transfer.
   * @param {Transfer} transfer A Transfer object.
   * @return {Array<TransferComponent>} A list of TransferComponents.
   */
  _getTransferComponents (transfer) {
    const serialized = new Transfer(transfer)
    serialized.block = transfer.block
    serialized.implicitStart = transfer.implicitStart
    if (transfer.implicitStart === undefined) {
      serialized.implicitStart = serialized.typedStart
    }
    serialized.implicitEnd = transfer.implicitEnd
    if (transfer.implicitEnd === undefined) {
      serialized.implicitEnd = serialized.typedEnd
    }

    const components = []

    // Left implicit component.
    if (!serialized.start.eq(serialized.implicitStart)) {
      components.push(
        new TransferComponent({
          ...serialized,
          ...{
            start: serialized.implicitStart,
            end: serialized.start,
            implicit: true
          }
        })
      )
    }

    // Right implicit component.
    if (!serialized.end.eq(serialized.implicitEnd)) {
      components.push(
        new TransferComponent({
          ...serialized,
          ...{
            start: serialized.end,
            end: serialized.implicitEnd,
            implicit: true
          }
        })
      )
    }

    // Transfer (non-implicit) component.
    components.push(new TransferComponent(serialized))

    return components
  }

  /**
   * Picks elements from a list that cover a given amount.
   * @param {Array<Range>|Array<UntypedSnapshot>} arr List to pick from.
   * @param {string} token A token address.
   * @param {number} amount Number of tokens being sent.
   * @return {Array<Range>|Array<UntypedSnapshot>} List of items that cover the amount.
   */
  _pickElements (arr, token, amount) {
    token = new BigNum(token, 'hex')
    amount = new BigNum(amount, 'hex')

    const available = arr
      .filter((item) => {
        return item.token.eq(token)
      })
      .sort((a, b) => {
        return b.end.sub(b.start).sub(a.end.sub(a.start))
      })
    const picked = []

    while (amount.gtn(0)) {
      if (available.length === 0) {
        throw new Error(
          'Address does not have enough balance to cover the amount.'
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

    picked.sort((a, b) => {
      if (!a.token.eq(b.token)) {
        return a.token.sub(b.token)
      } else {
        return a.start.sub(b.start)
      }
    })

    return picked
  }

  /**
   * Checks if the current state equals a given state.
   * @param {Array<Snapshot>} snapshots A list of Snapshots.
   * @return {boolean} `true` if the states are equal, `false` otherwise.
   */
  _equals (snapshots) {
    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = new Snapshot(snapshots[i])
      if (!this.snapshots[i].equals(snapshot)) {
        return false
      }
    }
    return true
  }
}

module.exports = SnapshotManager
