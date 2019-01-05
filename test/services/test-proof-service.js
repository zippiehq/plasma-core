const assert = require('chai').assert
const ProofService = new require('../../src/services/proof-service')
const ProofTool = new ProofService

describe.only('Snapshot splitting', function () {
    it('should correctly splitSnapshotAtBounds', function () {
        const snapshot = {start: 0, end: 100, owner: 'me', block: 1337}
        const bounds = [0, 1, 2, 6, 2000]
        const split = ProofTool.splitSnapshotAtBounds(snapshot, bounds)
        const expectedResult = [
            {start: 0, end: 1, owner: 'me', block: 1337},
            {start: 1, end: 2, owner: 'me', block: 1337},
            {start: 2, end: 6, owner: 'me', block: 1337},
            {start: 6, end: 100, owner: 'me', block: 1337}
        ]
        assert.deepEqual(split, expectedResult)
    })

    it('should correctly splitSnapshotsAtBounds', function () {
        const snapshots = [
            {start: 0, end: 100, owner: 'me', block: 1337},
            {start: 50, end: 400, owner: 'you', block: 400}
        ]
        const bounds = [1, 2, 6, 203]
        const split = ProofTool.splitSnapshotsAtBounds(snapshots, bounds)
        const expectedResult = [
            {start: 0, end: 1, owner: 'me', block: 1337},
            {start: 1, end: 2, owner: 'me', block: 1337},
            {start: 2, end: 6, owner: 'me', block: 1337},
            {start: 6, end: 100, owner: 'me', block: 1337},
            {start: 50, end: 203, owner: 'you', block: 400},
            {start: 203, end: 400, owner: 'you', block: 400}
        ]
        assert.deepEqual(split, expectedResult)
    })
})