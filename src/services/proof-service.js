const BaseService = require('./base-service')
// const BN = require('web3').utils.BN

class ProofSerivce extends BaseService {
  get name () {
    return 'proof-service'
  }

  // history[blockNum][i] = {ith transaction, its trIndex, [leafindex], [branch]}
  checkHistoryProof (incomingTx, history, deposits) {
    if (this.wereDepositsExitedBeforeTransaction(incomingTx, deposits)) throw new Error('invalid history proof--didn\'t give the most recent deposits')
    const [relevantHistory, verifiedStart] = this.getRelevantHistory(incomingTx, history, deposits)
    try {
      const appliedSnapshots = this.applyHistoryToSnapshots(relevantHistory, verifiedStart)
      this.checkifSnapshotsSatisfyTransaction(appliedSnapshots) // check owners of incomingTx senders... or just include incomingTx in history???
    } catch (err) {
      throw err
    }
  }

  // TODO: implement
  wereDepositsExitedBeforeTransaction (relevantTransaction, deposits) {
    return false
  }

  getRelevantHistory (transaction, history, deposits) { // todo implement (for now it's premature optimization)
    // intersect with most recent verified histories here (along with trimming "excess proofs" ?)
    return [history, deposits]
  }

  applyHistoryToSnapshots (history, snapshots) {
    for (let blockNumber in history) {
      for (let proof of history[blockNumber]) {
        this.checkProofValidity(proof, blockNumber)
        snapshots = this.applyTransactionProof(proof, snapshots)
      }
    }
    return snapshots
  }

  applyTransactionProof (proof, snapshots) {
    const transaction = proof.transaction
    const trIndex = transaction.trIndex
    const transfer = transaction.transfers[trIndex]
    const blockNumber = transaction.blockNumber
    const [implicitStart, implicitEnd] = this.getImplicitBounds(proof)
    const potentiallyUpdatedSnapshots = this.getSnapshotsIntersectingRange(implicitStart, implicitEnd, snapshots)
    let updatedSnapshots = potentiallyUpdatedSnapshots.filter((snapshot) => { return snapshot.blockNumber === blockNumber - 1 })
    for (let i in updatedSnapshots) { updatedSnapshots[i].blockNumber += 1 } // increment all affected snapshots' blockNum to this new block!
    updatedSnapshots = this.splitSnapshotsAtBounds(updatedSnapshots, [transfer.start, transfer.end])
    const transferredSnapshots = this.getSnapshotsIntersectingRange(transfer.start, transfer.end, updatedSnapshots)
    for (let i in transferredSnapshots) {
      const snapshot = transferredSnapshots[i]
      if (snapshot.owner !== transfer.sender) { throw new Error('invalid history -- sender not the rightful owner!  at: ', snapshot) }
      const sentRangeIndex = updatedSnapshots.findIndex((oldSnapshot) => { return oldSnapshot.start === snapshot.start && oldSnapshot.end === snapshot.end })
      updatedSnapshots[sentRangeIndex].owner = transfer.recipient // there will always be exact matches here because we split transferred and updated at the same bounds
    }
    return this.combineVerifiedSnapshots(snapshots, updatedSnapshots)
  }

  // todo implemnt lol
  // this does the check the smart contract will do to confirm transaction validity.
  // takes in proof = {transaction, TRIndex, [leafIndices], [branches]} and blockNumber
  // todo check blocknumber
  /*
  Check if transaction was included and wekll-formed: for each transaction in multisend:
      - valid merkle sum branch
      - transferBounds within getImplicitBounds
      - right blocknum
      - valid signature */
  checkProofValidity (proof, blockNumber) { // proof = {ith relevant tx, ITS transferIndex, [its tree indexes], [its [branches]]}
    // const firstBranchLength = proof.branches[0].length
    // for (let branch in proof.branches) if (branch.length !== firstBranchLength) return false // proofs must be equal length
    // const root = getBlockRoot(blockNumber) // TODO hardcode or integrate into ETHservice
    // for (let i = 0; i < proof.leafIndices.length; i++) { // todo make sure we don't iterate over proof.branches.length elsewhere, this could result in a vuln?
    //   const branch = proof.branches[i]
    //   // todo checks on indexbitstring.length <= proof length, proof not empty, proof divides 2
    //   const index = new BN(proof.leafIndices[i]).toString(2, firstBranchLength / 2) // path bitstring
    //   const path = index.split('').reverse().join('') // reverse ordering so we start with the bottom
    //   let encoding = proof.transaction.encode()
    //   encoding = '0x' + new BN(encoding).toString(16, 2 * encoding.length)
    //   const leafParent = (path[0] === '0') ? branch[0] : branch[1]
    //   if ('0x' + leafParent.data.slice(0, 2 * 32) !== ST.hash(encoding)) return false // wasn't the right TX!
    //   for (let j = 1; k < path.length; j++) {
    //     const bit = path[j]
    //     const potentialParent = (bit === '0') ? branch[2 * j] : branch[2 * j + 1]
    //     const actualParent = ST.parent(branch[2 * (j - 1)], branch[2 * (j - 1) + 1])
    //     if (!areNodesEquivalent(actualParent, potentialParent)) return false
    //   }
    //   const potentialRoot = (branch.length > 1) ? ST.parent(branch[branch.length - 2], branch[branch.length - 1]) : branch[branch.length]
    //   // TODO check if sum is ffffffff
    //   if (!areNodesEquivalent(potentialRoot, root)) return false
    // }
    return true
  }

  getBlockRoot (blockNumber) {
    // TODO hardcode for testing then implement w/ contract
  }

  getImplicitBounds (proof) {
    return [proof.transaction.implicitStart, proof.transaction.implicitEnd] // set manually for testing range logic
    // const leafIndex = new BN(proof.leafIndices[proof.trIndex])
    // const branch = proof.branches[proof.trIndex]
    // const path = leafIndex.toString(2, branch.length / 2).split('').reverse().join('') // reverse the ordering so we start with the bottom bit
    // for (let i in path) {
    //   const bit = path[i]
    //   if (bit === '0') rightSum = rightSum.add(firstBranch[i + 1].sum)
    //   if (bit === '1') leftSum = leftSum.add(lastBranch[i].sum)
    // }
    // const implicitStart = leftSum
    // const implicitEnd = new BN('ffffffffffffffffffffffffffffffff', 16).sub(rightSum)
    // return [implicitStart, implicitEnd]
  }

  // TODO: replace all the math here with BN

  /* for each snapshot:
    splitNapshots = splitSnapshotAtBounds(snapshot)
    newSnapshots = newSna.concat(splitSnapshots)
  return newSnapshots

  // history  =[[proof]]
  // history[block][i] = proof = {proof = {incomingTransaction, TRIndex, [treeIndex, branch]}
  /* class RangeManager():
    ...

  applyTransaction = function(snapshots, transaction):
    Check if transaction was included and wekll-formed: for each transaction in multisend:
      - valid merkle sum branch
      - transferBounds within getImplicitBounds
      - right blocknum
      - valid signature
    Check if last transfer.sendr == owner at prev block in state
    apply the transfer

      -split out the transfer at implicitbounds
      -increment block
      -split out the send at transferbounds
      -change the owner at the center
    clean()
    return updatesSnapshots

  try:
      incoming_tx = { ... }
      relevant_history = history.map(lambda tx: is_relevant(tx, incoming_tx), history)

      for transaction of relevant_history:
          state = apply_transaction(state, transaction)

      return state
  except err:
      throw err
    */

  getSnapshotsIntersectingRange (start, end, snapshots) {
    let intersecting = []
    for (let snapshot of snapshots) {
      const largerStart = Math.max(snapshot.start, start)
      const smallerEnd = Math.min(snapshot.end, end)
      intersecting.push({
        start: largerStart,
        end: smallerEnd,
        owner: snapshot.owner,
        blockNumber: snapshot.blockNumber
      })
    }
    return this.cleanSnapshots(intersecting)
  }

  cleanSnapshots (snapshots) { // removes snapshots with start == end, merge any adjacent with same owner/blockNum.  assumes none overlapping
    snapshots = snapshots.sort((a, b) => { return a.start - b.start })
    snapshots = snapshots.filter((snapshot) => { return snapshot.start !== snapshot.end })
    let i = 0
    while (i < snapshots.length - 1) {
      let thisSnapshot = snapshots[i]
      const nextSnapshot = snapshots[i + 1]
      if (thisSnapshot.owner !== nextSnapshot.owner || thisSnapshot.blockNumber !== nextSnapshot.blockNumber) {
        i++
      } else {
        const snapshotToInsert = {
          start: thisSnapshot.start,
          end: nextSnapshot.end,
          owner: thisSnapshot.owner,
          blockNumber: thisSnapshot.blockNumber
        }
        snapshots.splice(i, 2, snapshotToInsert)
      }
    }
    return snapshots
  }

  combineVerifiedSnapshots (snapshots1, snapshots2) {
    // all the potential bounds are the starts and ends of the snapshots.  We need to split all of these pieces out, find the dupes, and choose the ones with higher blockNumber
    const firstBounds = this.getAllStartsAndEnds(snapshots1)
    const otherBounds = this.getAllStartsAndEnds(snapshots2)
    const bounds = firstBounds.concat(otherBounds).filter((elem, index, self) => { return index === self.indexOf(elem) }) // combine and de-dupe
    let split1 = this.splitSnapshotsAtBounds(snapshots1, bounds)
    let split2 = this.splitSnapshotsAtBounds(snapshots2, bounds)
    let mergedSnaps = []
    let untouchedInSplit2 = split2
    // once split maximally, this loop chooses the overlaps with higher blockNumber along with those non-overlapping.
    loop1: // TODO: replace this weird double matching n^2 algorithm with an O(n) -- realized after we can just concat arrays, sort by start, and compare sequentially.  much cleaner! (?)
    for (let snapshot of split1) {
      for (let competingSnapshot of split2) {
        if (snapshot.start === competingSnapshot.start) {
          const laterSnapshot = (snapshot.blockNumber > competingSnapshot.number) ? snapshot : competingSnapshot
          mergedSnaps.push(laterSnapshot)
          untouchedInSplit2.splice(untouchedInSplit2.indexOf(competingSnapshot), 1) // remove it from untouched because it was just compared
          continue loop1
        }
      }
      mergedSnaps.push(snapshot) // if we didn't continue loop1 above, it's untouched and we have to add it to return vals
    }
    const allSnapshotToClean = mergedSnaps.concat(untouchedInSplit2)
    return this.cleanSnapshots(allSnapshotToClean)
  }

  getAllStartsAndEnds (snapshots) {
    const starts = snapshots.map((snapshot) => { return snapshot.start })
    const ends = snapshots.map((snapshot) => { return snapshot.end })
    return starts.concat(ends)
  }

  splitSnapshotAtBounds (snapshot, bounds) {
    bounds = bounds.sort((a, b) => { return a - b })
    let relevantBounds = []
    bounds.forEach((bound) => { if (snapshot.start < bound && snapshot.end > bound) relevantBounds.push(bound) })
    if (relevantBounds.length === 0) return [snapshot] // no split occurred
    let splitSnaps = []
    let nextStart = snapshot.start
    for (let bound of relevantBounds) {
      splitSnaps.push({
        start: nextStart,
        end: bound,
        owner: snapshot.owner,
        blockNumber: snapshot.blockNumber
      })
      nextStart = bound
    }
    splitSnaps.push({
      start: nextStart,
      end: snapshot.end,
      owner: snapshot.owner,
      blockNumber: snapshot.blockNumber
    })
    return splitSnaps
  }

  splitSnapshotsAtBounds (snapshots, bounds) {
    let newSnapshots = []
    for (let snapshot of snapshots) {
      const splitSnapshot = this.splitSnapshotAtBounds(snapshot, bounds)
      newSnapshots = newSnapshots.concat(splitSnapshot)
    }
    return newSnapshots
  }
}

module.exports = ProofSerivce
