const BigNum = require('bn.js')
const _ = require('lodash')

/**
 * Subcomponent of ProofService.
 * Manages a temporary state that's built upon by a transaction proof.
 */
class SnapshotManager {
  constructor (snapshots = []) {
    this.snapshots = snapshots
  }

  /**
   * Applies a single deposit to the local state.
   * @param {*} deposit Deposit to apply.
   */
  applyDeposit (deposit) {
    if (!this._validSnapshot(deposit)) {
      throw new Error('Invalid deposit')
    }

    this._insertSnapshot({
      start: deposit.start,
      end: deposit.end,
      block: deposit.block,
      owner: deposit.owner
    })
  }

  /**
   * Applies a single transaction to the local state.
   * @param {*} transaction Transaction to apply.
   */
  applyTransaction (transaction) {
    transaction.transfers.forEach((transfer) => {
      if (!this._validSnapshot(transfer)) {
        throw new Error('Invalid transaction')
      }
      const overlapping = this._getOverlappingSnapshots(transfer)
      overlapping.forEach((snapshot) => {
        if (
          snapshot.owner !== transfer.sender ||
          !snapshot.block.add(new BigNum(1)).eq(new BigNum(transaction.block))
        ) {
          throw new Error('Invalid state transition')
        }

        // Remove the old snapshot.
        this._removeSnapshot(snapshot)

        // Insert any newly created snapshots.
        if (snapshot.start < transfer.start) {
          this._insertSnapshot({
            start: snapshot.start,
            end: transfer.start,
            block: snapshot.block,
            owner: snapshot.owner
          })
        }
        if (snapshot.end > transfer.end) {
          this._insertSnapshot({
            start: transfer.end,
            end: snapshot.end,
            block: snapshot.block,
            owner: snapshot.owner
          })
        }
        this._insertSnapshot({
          start: Math.max(snapshot.start, transfer.start),
          end: Math.min(snapshot.end, transfer.end),
          block: transaction.block,
          owner: transfer.recipient
        })
      })
    })
  }

  /**
   * Checks if a transaction is corroborated by the local state.
   * @param {*} transaction A Transaction object.
   * @return {boolean} `true` if the transaction is valid, `false` otherwise.
   */
  static verifyTransaction (transaction, snapshots) {
    const snapshotManager = new SnapshotManager(_.cloneDeep(snapshots))
    snapshotManager.applyTransaction(transaction)
    return transaction.transfers.every((transfer) => {
      return snapshotManager._hasSnapshot({
        start: transfer.start,
        end: transfer.end,
        block: transaction.block,
        owner: transfer.recipient
      })
    })
  }

  /**
   * Determines if the local state contains a specific snapshot.
   * @param {*} snapshot A Snapshot object.
   * @return {boolean} `true` if the state contains the snapshot, `false` otherwise.
   */
  _hasSnapshot (snapshot) {
    snapshot = this._castSnapshot(snapshot)
    return this.snapshots.some((s) => {
      return (
        s.start.eq(snapshot.start) &&
        s.end.eq(snapshot.end) &&
        s.block.eq(snapshot.block) &&
        s.owner === snapshot.owner
      )
    })
  }

  /**
   * Returns stored snapshots that overlap with the given snapshot.
   * @param {*} snapshot A Snapshot object.
   * @return {Array} An array of stored snapshots that overlap with the snapshot.
   */
  _getOverlappingSnapshots (snapshot) {
    return this.snapshots.filter((s) => {
      return Math.max(s.start, snapshot.start) < Math.min(s.end, snapshot.end)
    })
  }

  /**
   * Checks if a given snapshot is valid or not.
   * @param {*} snapshot A Snapshot object.
   * @return {boolean} `true` if the snapshot is valid, `false` otherwise.
   */
  _validSnapshot (snapshot) {
    snapshot = this._castSnapshot(snapshot)
    return snapshot.start.lt(snapshot.end)
  }

  /**
   * Casts a snapshot-like object into a snapshot.
   * @param snapshot A snapshot-like object.
   * @return A Snapshot object.
   */
  _castSnapshot (snapshot) {
    return {
      start: new BigNum(snapshot.start),
      end: new BigNum(snapshot.end),
      block: new BigNum(snapshot.block),
      owner: snapshot.owner
    }
  }

  /**
   * Inserts a snapshot into the local store of snapshots.
   * @param {*} snapshot A Snapshot object to insert.
   */
  _insertSnapshot (snapshot) {
    snapshot = this._castSnapshot(snapshot)

    this.snapshots.push(snapshot)
    this.snapshots.sort((a, b) => {
      return a.start - b.start
    })
    this.snapshots = this._mergeSnapshots(this.snapshots)
  }

  /**
   * Removes a snapshot from the local store of snapshots.
   * @param {*} snapshot A Snapshot object.
   */
  _removeSnapshot (snapshot) {
    this.snapshots = this.snapshots.filter((s) => {
      return s !== snapshot
    })
  }

  /**
   * Merges and reduces a list of snapshots.
   * Combines any snapshots that share the same start or end
   * and also share the same block number and owner.
   * @param {Array} snapshots A list of Snapshot objects.
   * @return {Array} The merged list of Snapshot objects.
   */
  _mergeSnapshots (snapshots) {
    let merged = []

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
}

module.exports = SnapshotManager
