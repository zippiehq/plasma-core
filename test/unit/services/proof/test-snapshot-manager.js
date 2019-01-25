const chai = require('chai')
const BigNum = require('bn.js')
const utils = require('plasma-utils')

const should = chai.should()

const SnapshotManager = require('../../../../src/services/proof/snapshot-manager')
const constants = utils.constants
const accounts = constants.ACCOUNTS

describe('SnapshotManager', () => {
  const deposit = { token: new BigNum(0), start: new BigNum(0), end: new BigNum(100), block: new BigNum(0), owner: accounts[0].address }

  it('should be able to apply a deposit', () => {
    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)

    snapshotManager.snapshots[0].should.deep.equal(deposit)
  })

  it('should be able to apply a valid transaction', () => {
    const transaction = {
      block: 1,
      transfers: [
        { token: new BigNum(0), start: 0, end: 100, sender: accounts[0].address, recipient: accounts[1].address }
      ]
    }
    const expected = { token: new BigNum(0), start: new BigNum(0), end: new BigNum(100), block: new BigNum(1), owner: accounts[1].address }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    snapshotManager.snapshots[0].should.deep.equal(expected)
  })

  it('should apply a transaction that goes over an existing range', () => {
    const transaction = {
      block: 1,
      transfers: [
        { token: new BigNum(0), start: 0, end: 200, sender: accounts[0].address, recipient: accounts[1].address }
      ]
    }
    const expected = { token: new BigNum(0), start: new BigNum(0), end: new BigNum(100), block: new BigNum(1), owner: accounts[1].address }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)
    snapshotManager.applyTransaction(transaction)

    snapshotManager.snapshots[0].should.deep.equal(expected)
  })

  it('should apply a transaction that goes under an existing range', () => {
    const transaction = {
      block: 1,
      transfers: [
        { token: new BigNum(0), start: 0, end: 50, sender: accounts[0].address, recipient: accounts[1].address }
      ]
    }
    const expected = [
      { token: new BigNum(0), start: new BigNum(0), end: new BigNum(50), block: new BigNum(1), owner: accounts[1].address },
      { token: new BigNum(0), start: new BigNum(50), end: new BigNum(100), block: new BigNum(0), owner: accounts[0].address }
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
        { token: new BigNum(0), start: 0, end: 100, sender: accounts[1].address, recipient: accounts[0].address }
      ]
    }

    const snapshotManager = new SnapshotManager()
    snapshotManager.applyDeposit(deposit)

    should.Throw(() => {
      snapshotManager.applyTransaction(transaction)
    }, 'Invalid state transition')
  })
})
