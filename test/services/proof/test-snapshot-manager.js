const chai = require('chai')
const should = chai.should()

const SnapshotManager = require('../../../src/services/proof/snapshot-manager')
const constants = require('../../constants')
const accounts = constants.ACCOUNTS

describe('SnapshotManager', () => {
  const deposit = { start: 0, end: 100, block: 0, owner: accounts[0] }

  it('should be able to apply a deposit', () => {
    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)

    snapshotManager.snapshots[0].should.deep.equal(deposit)
  })

  it('should be able to apply a valid transaction', () => {
    const transaction = {
      block: 1,
      transfers: [
        { start: 0, end: 100, from: accounts[0], to: accounts[1] }
      ]
    }
    const expected = { start: 0, end: 100, block: 1, owner: accounts[1] }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    snapshotManager.snapshots[0].should.deep.equal(expected)
  })

  it('should apply a transaction that goes over an existing range', () => {
    const transaction = {
      block: 1,
      transfers: [
        { start: 0, end: 200, from: accounts[0], to: accounts[1] }
      ]
    }
    const expected = { start: 0, end: 100, block: 1, owner: accounts[1] }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    snapshotManager.snapshots[0].should.deep.equal(expected)
  })

  it('should apply a transaction that goes under an existing range', () => {
    const transaction = {
      block: 1,
      transfers: [
        { start: 0, end: 50, from: accounts[0], to: accounts[1] }
      ]
    }
    const expected = [
      { start: 0, end: 50, block: 1, owner: accounts[1] },
      { start: 50, end: 100, block: 0, owner: accounts[0] }
    ]

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    snapshotManager.snapshots.should.deep.equal(expected)
  })

  it('should not apply a transaction with an invalid sender', () => {
    const transaction = {
      block: 1,
      transfers: [
        { start: 0, end: 100, from: accounts[1], to: accounts[0] }
      ]
    }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)

    should.Throw(() => {
      snapshotManager.applyTransaction(transaction)
    }, 'Invalid state transition')
  })
})
