const assert = require('chai').assert

const SnapshotManager = require('../../../src/services/proof/snapshot-manager')

describe('SnapshotManager', () => {
  const account1 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
  const account2 = '0x838e93821250388d0fa7ea74c4f89872e705e31a'
  const deposit = {
    start: 0,
    end: 100,
    block: 0,
    owner: account1
  }

  it('should be able to apply a deposit', () => {
    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    assert.deepEqual(deposit, snapshotManager.snapshots[0], 'deposit was applied')
  })
  it('should be able to apply a valid transaction', () => {
    const transaction = {
      block: 1,
      transfers: [
        {
          start: 0,
          end: 100,
          from: account1,
          to: account2
        }
      ]
    }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    const expectedSnapshot = {
      start: 0,
      end: 100,
      block: 1,
      owner: account2
    }
    assert.deepEqual(expectedSnapshot, snapshotManager.snapshots[0], 'transaction was applied successfully')
  })
  it('should apply a transaction that goes over an existing range', () => {
    const transaction = {
      block: 1,
      transfers: [
        {
          start: 0,
          end: 200, // Goes over the end point of 100 but still valid.
          from: account1,
          to: account2
        }
      ]
    }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    const expectedSnapshot = {
      start: 0,
      end: 100,
      block: 1,
      owner: account2
    }
    assert.deepEqual(expectedSnapshot, snapshotManager.snapshots[0], 'transaction was applied successfully')
  })
  it('should apply a transaction that goes under an existing range', () => {
    const transaction = {
      block: 1,
      transfers: [
        {
          start: 0,
          end: 50, // Goes over the end point of 100 but still valid.
          from: account1,
          to: account2
        }
      ]
    }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    const expectedSnapshots = [
      {
        start: 0,
        end: 50,
        block: 1,
        owner: account2
      },
      {
        start: 50,
        end: 100,
        block: 0,
        owner: account1
      }
    ]
    assert.deepEqual(expectedSnapshots, snapshotManager.snapshots, 'transaction was applied successfully')
  })
  it('should not apply a transaction with an invalid sender', () => {
    const transaction = {
      block: 1,
      transfers: [
        {
          start: 0,
          end: 100,
          from: account2, // Invalid sender.
          to: account2
        }
      ]
    }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)

    assert.throws(() => {
      snapshotManager.applyTransaction(transaction)
    }, 'Invalid state transition', 'snapshot manager threw correctly')
  })
})
