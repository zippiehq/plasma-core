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

    this._insertSnapshot(deposit)
  }

  /**
   * Applies a single transaction to the local state.
   * @param {*} transaction Transaction to apply.
   */
  applyTransaction (transaction) {
    let transfers = transaction.transfers.reduce((curr, transfer) => {
      transfer = this._castTransfer(transfer)
      if (!this._validSnapshot(transfer)) {
        throw new Error('Invalid transaction')
      }
      if (!transfer.start.eq(transfer.implicitStart)) {
        curr.push({
          ...transfer,
          ...{
            start: transfer.implicitStart,
            end: transfer.start,
            implicit: true
          }
        })
      }
      if (!transfer.end.eq(transfer.implicitEnd)) {
        curr.push({
          ...transfer,
          ...{ start: transfer.end, end: transfer.implicitEnd, implicit: true }
        })
      }
      // TODO: This is kinda hacky for now, but it works.
      // Just make sure that only empty block transactions have this flag.
      if (transaction.isEmptyBlockTransaction) {
        curr.push({
          ...transfer,
          ...{ implicit: true }
        })
      } else {
        curr.push(transfer)
      }
      return curr
    }, [])

    transfers.forEach((transfer) => {
      const overlapping = this.snapshots.filter((snapshot) => {
        return (
          Math.max(snapshot.start, transfer.start) <
          Math.min(snapshot.end, transfer.end)
        )
      })
      overlapping.forEach((snapshot) => {
        if (
          !(transfer.implicit || snapshot.owner === transfer.sender) ||
          !(
            transaction.isEmptyBlockTransaction ||
            snapshot.token.eq(transfer.token)
          ) ||
          !snapshot.block
            .add(new BigNum(1))
            .eq(new BigNum(transaction.block, 'hex'))
        ) {
          throw new Error('Invalid state transition')
        }

        // Remove the old snapshot.
        this._removeSnapshot(snapshot)

        // Insert any newly created snapshots.
        if (snapshot.start.lt(transfer.start)) {
          this._insertSnapshot({
            ...snapshot,
            ...{ end: transfer.start }
          })
        }
        if (snapshot.end.gt(transfer.end)) {
          this._insertSnapshot({
            ...snapshot,
            ...{ start: transfer.end }
          })
        }
        this._insertSnapshot({
          token: snapshot.token,
          start: Math.max(snapshot.start, transfer.start),
          end: Math.min(snapshot.end, transfer.end),
          block: transaction.block,
          owner: transfer.implicit ? snapshot.owner : transfer.recipient
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
    return transaction.transfers.every((transfer) => {
      return (
        snapshotManager._hasSnapshot({
          token: transfer.token,
          start: transfer.start,
          end: transfer.end,
          block: transaction.block,
          owner: transfer.recipient
        }) &&
        snapshotManager._validSnapshot(snapshotManager._castTransfer(transfer))
      )
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
        s.token.eq(snapshot.token) &&
        s.start.lte(snapshot.start) &&
        s.end.gte(snapshot.end) &&
        s.block.eq(snapshot.block) &&
        s.owner === snapshot.owner
      )
    })
  }

  _snapshotEquals (a, b) {
    return (
      a.token.eq(b.token) &&
      a.start.eq(b.start) &&
      a.end.eq(b.end) &&
      a.block.eq(b.block) &&
      a.owner === b.owner
    )
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
      token: new BigNum(snapshot.token, 'hex'),
      start: new BigNum(snapshot.start, 'hex'),
      end: new BigNum(snapshot.end, 'hex'),
      block: new BigNum(snapshot.block, 'hex'),
      owner: snapshot.owner
    }
  }

  /**
   * Casts a transfer-like object into a transfer.
   * @param transfer A transfer-like object.
   * @return A Transfer object.
   */
  _castTransfer (transfer) {
    // TODO: Get rid of this.
    transfer.implicitStart =
      transfer.implicitStart === undefined
        ? transfer.start
        : transfer.implicitStart
    transfer.implicitEnd =
      transfer.implicitEnd === undefined ? transfer.end : transfer.implicitEnd
    return {
      token: new BigNum(transfer.token, 'hex'),
      start: new BigNum(transfer.start, 'hex'),
      end: new BigNum(transfer.end, 'hex'),
      implicitStart: new BigNum(transfer.implicitStart, 'hex'),
      implicitEnd: new BigNum(transfer.implicitEnd, 'hex'),
      sender: transfer.sender,
      recipient: transfer.recipient
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
      return a.start.sub(b.start)
    })
    this.snapshots = this._mergeSnapshots(this.snapshots)
  }

  /**
   * Removes a snapshot from the local store of snapshots.
   * @param {*} snapshot A Snapshot object.
   */
  _removeSnapshot (snapshot) {
    this.snapshots = this.snapshots.filter((s) => {
      return !this._snapshotEquals(s, snapshot)
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
        if (
          !s.block.eq(snapshot.block) ||
          s.owner !== snapshot.owner ||
          !s.token.eq(snapshot.token)
        ) {
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
