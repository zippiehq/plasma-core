const overlappingRanges = (ranges, rangeToOverlap) => {
  return ranges.filter((range) => {
    return (
      Math.max(range.start, rangeToOverlap.start) <=
      Math.min(range.end, rangeToOverlap.end)
    )
  })
}

class SnapshotManager {
  constructor (snapshots = []) {
    this.snapshots = snapshots
  }

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

  applyTransaction (transaction) {
    transaction.transfers.forEach((transfer) => {
      if (!this._validSnapshot(transfer)) {
        throw new Error('Invalid transaction')
      }
      const overlapping = this._getOverlappingSnapshots(transfer)
      overlapping.forEach((snapshot) => {
        if (
          snapshot.owner !== transfer.from ||
          snapshot.block + 1 !== transaction.block
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
          owner: transfer.to
        })
      })
    })
  }

  hasSnapshot (snapshot) {
    return this.snapshots.some((s) => {
      return (
        s.start === snapshot.start &&
        s.end === snapshot.end &&
        s.block === snapshot.block &&
        s.owner === snapshot.owner
      )
    })
  }

  _getOverlappingSnapshots (snapshot) {
    return overlappingRanges(this.snapshots, snapshot)
  }

  _validSnapshot (snapshot) {
    return snapshot.start < snapshot.end
  }

  _insertSnapshot (snapshot) {
    this.snapshots.push(snapshot)
    this.snapshots.sort((a, b) => {
      return a.start - b.start
    })
    this.snapshots = this._mergeSnapshots(this.snapshots)
  }

  _removeSnapshot (snapshot) {
    this.snapshots = this.snapshots.filter((s) => {
      return s !== snapshot
    })
  }

  _mergeSnapshots (snapshots) {
    let merged = []

    snapshots.forEach((snapshot) => {
      let left, right
      merged.forEach((s, i) => {
        if (s.block !== snapshot.block) {
          return
        }

        if (s.end === snapshot.start) {
          left = i
        }
        if (s.start === snapshot.end) {
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
