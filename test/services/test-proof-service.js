const assert = require('chai').assert
const ProofService = new require('../../src/services/proof-service')
const ProofTool = new ProofService

describe.only('Snapshot splitting', function () {
    it('should correctly splitSnapshotAtBounds', function () {
        const snapshot = {start: 0, end: 100, owner: 'me', blockNumber: 1337}
        const bounds = [0, 1, 2, 6, 2000]
        const split = ProofTool.splitSnapshotAtBounds(snapshot, bounds)
        const expectedResult = [
            {start: 0, end: 1, owner: 'me', blockNumber: 1337},
            {start: 1, end: 2, owner: 'me', blockNumber: 1337},
            {start: 2, end: 6, owner: 'me', blockNumber: 1337},
            {start: 6, end: 100, owner: 'me', blockNumber: 1337}
        ]
        assert.deepEqual(split, expectedResult)
    })

    it('should correctly splitSnapshotsAtBounds', function () {
        const snapshots = [
            {start: 0, end: 100, owner: 'me', blockNumber: 1337},
            {start: 50, end: 400, owner: 'you', blockNumber: 400}
        ]
        const bounds = [1, 2, 6, 203]
        const split = ProofTool.splitSnapshotsAtBounds(snapshots, bounds)
        const expectedResult = [
            {start: 0, end: 1, owner: 'me', blockNumber: 1337},
            {start: 1, end: 2, owner: 'me', blockNumber: 1337},
            {start: 2, end: 6, owner: 'me', blockNumber: 1337},
            {start: 6, end: 100, owner: 'me', blockNumber: 1337},
            {start: 50, end: 203, owner: 'you', blockNumber: 400},
            {start: 203, end: 400, owner: 'you', blockNumber: 400}
        ]
        assert.deepEqual(split, expectedResult)
    })
    //TODO: split out a separate cleanSnapshots test, though this implicitly tests it would be nice to separate
    it('should correctly combineVerifiedSnapshots', function () {
        const firstSnapshots = [
            {start: 0, end: 15, owner: 'a', blockNumber: 0},
            {start: 20, end: 30, owner: 'b', blockNumber: 1},
            {start: 45, end: 50, owner: 'c', blockNumber: 2}
        ]
        const otherSnapshots = [
            {start: 5, end: 10, owner: 'd', blockNumber: 3},
            {start: 25, end: 35, owner: 'e', blockNumber: 4},
            {start: 40, end: 55, owner: 'f', blockNumber: 5}
        ]
        const expectedCombo = [
            {start: 0, end: 5, owner: 'a', blockNumber: 0},
            {start: 5, end: 10, owner: 'd', blockNumber: 3},
            {start: 10, end: 15, owner: 'a', blockNumber: 0},
            {start: 20, end: 25, owner: 'b', blockNumber: 1},
            {start: 25, end: 35, owner: 'e', blockNumber: 4},
            {start: 40, end: 55, owner: 'f', blockNumber: 5}
        ]
        const combo = ProofTool.combineVerifiedSnapshots(firstSnapshots, otherSnapshots)
        assert.deepEqual(combo, expectedCombo)
    })
    it('should correctly getSnapshotsIntersectingRange', function () {
        const snapshots = [
            {start: 0, end: 10, owner: 'a', blockNumber: 0},
            {start: 10, end: 20, owner: 'b', blockNumber: 1},
            {start: 20, end: 30, owner: 'c', blockNumber: 2}
        ]
        const start = 5
        const end = 25
        const expectedIntersection = [
            {start: 5, end: 10, owner: 'a', blockNumber: 0},
            {start: 10, end: 20, owner: 'b', blockNumber: 1},
            {start: 20, end: 25, owner: 'c', blockNumber: 2},
        ]
        const intersection = ProofTool.getSnapshotsIntersectingRange(snapshots, start, end)
        assert.deepEqual(intersection, expectedIntersection)

    })
})