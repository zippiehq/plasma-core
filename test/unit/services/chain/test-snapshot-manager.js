const chai = require('chai')
const BigNum = require('bn.js')
const utils = require('plasma-utils')

const should = chai.should()

const SnapshotManager = require('../../../../src/services/chain/snapshot-manager')
const constants = utils.constants
const accounts = constants.ACCOUNTS

describe('SnapshotManager', () => {
  let snapshotManager
  const deposit = { start: new BigNum(0), end: new BigNum(100), block: new BigNum(0), owner: accounts[0].address }

  beforeEach(() => {
    snapshotManager = new SnapshotManager()
  })

  describe('applyDeposit', () => {
    it('should be able to apply a deposit', () => {
      snapshotManager.applyDeposit(deposit)

      snapshotManager._equals([deposit]).should.be.true
    })

    it('should not apply a deposit with start greater than end', () => {
      const badDeposit = { start: new BigNum(100), end: new BigNum(0), block: new BigNum(0), owner: accounts[0].address }
      should.Throw(() => {
        snapshotManager.applyDeposit(badDeposit)
      }, 'Invalid snapshot')
    })
  })

  describe('applyTransaction', () => {
    it('should be able to apply a valid transaction', () => {
      const transaction = {
        block: 1,
        transfers: [
          { start: 0, end: 100, sender: accounts[0].address, recipient: accounts[1].address }
        ]
      }
      const expected = { start: new BigNum(0), end: new BigNum(100), block: new BigNum(1), owner: accounts[1].address }

      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyTransaction(transaction)

      snapshotManager._equals([expected]).should.be.true
    })

    it('should apply a transaction that goes over an existing range', () => {
      const transaction = {
        block: 1,
        transfers: [
          { start: 0, end: 200, sender: accounts[0].address, recipient: accounts[1].address }
        ]
      }
      const expected = { start: new BigNum(0), end: new BigNum(100), block: new BigNum(1), owner: accounts[1].address }

      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyTransaction(transaction)

      snapshotManager._equals([expected]).should.be.true
    })

    it('should apply a transaction that goes under an existing range', () => {
      const transaction = {
        block: 1,
        transfers: [
          { start: 0, end: 50, sender: accounts[0].address, recipient: accounts[1].address }
        ]
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(50), block: new BigNum(1), owner: accounts[1].address },
        { start: new BigNum(50), end: new BigNum(100), block: new BigNum(0), owner: accounts[0].address }
      ]

      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyTransaction(transaction)

      snapshotManager._equals(expected).should.be.true
    })

    it('should apply a transaction with implicit start and ends', () => {
      const transaction = {
        block: 1,
        transfers: [
          { implicitStart: 0, start: 25, end: 75, implicitEnd: 100, sender: accounts[0].address, recipient: accounts[1].address }
        ]
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(25), block: new BigNum(1), owner: accounts[0].address },
        { start: new BigNum(25), end: new BigNum(75), block: new BigNum(1), owner: accounts[1].address },
        { start: new BigNum(75), end: new BigNum(100), block: new BigNum(1), owner: accounts[0].address }
      ]

      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyTransaction(transaction)

      snapshotManager._equals(expected).should.be.true
    })

    it('should apply a transaction with only an implicit end', () => {
      const transaction = {
        block: 1,
        transfers: [
          { start: 0, end: 75, implicitEnd: 100, sender: accounts[0].address, recipient: accounts[1].address }
        ]
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(75), block: new BigNum(1), owner: accounts[1].address },
        { start: new BigNum(75), end: new BigNum(100), block: new BigNum(1), owner: accounts[0].address }
      ]

      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyTransaction(transaction)

      snapshotManager._equals(expected).should.be.true
    })

    it('should apply a transaction where only an implicit part overlaps', () => {
      const deposit2 = { start: new BigNum(100), end: new BigNum(200), block: new BigNum(0), owner: accounts[1].address }
      const transaction = {
        block: 1,
        transfers: [
          { implicitStart: 0, start: 100, end: 200, sender: accounts[1].address, recipient: accounts[2].address }
        ]
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(100), block: new BigNum(1), owner: accounts[0].address },
        { start: new BigNum(100), end: new BigNum(200), block: new BigNum(1), owner: accounts[2].address }
      ]

      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyDeposit(deposit2)
      snapshotManager.applyTransaction(transaction)

      snapshotManager._equals(expected).should.be.true
    })
  })

  describe('validateTransaction', () => {
    it('should not verify a transaction with an invalid sender', () => {
      const transaction = {
        block: 1,
        transfers: [
          { start: 0, end: 100, sender: accounts[1].address, recipient: accounts[0].address }
        ]
      }

      snapshotManager.applyDeposit(deposit)

      snapshotManager.validateTransaction(transaction).should.be.false
    })
  })

  describe('applyExit', () => {
    it('should be able to apply an exit that equals a range', () => {
      const exit = {
        block: 1,
        start: 0,
        end: 100,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(100), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit with the same start but lower end than a range', () => {
      const exit = {
        block: 1,
        start: 0,
        end: 75,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(75), block: new BigNum(1), owner: constants.NULL_ADDRESS },
        { start: new BigNum(75), end: new BigNum(100), block: new BigNum(0), owner: accounts[0].address }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit with the same start higher lower end than a range', () => {
      const exit = {
        block: 1,
        start: 0,
        end: 125,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(125), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit with the same end but lower start than a range', () => {
      const deposit2 = {
        start: new BigNum(100),
        end: new BigNum(200),
        block: new BigNum(0),
        owner: accounts[0].address
      }
      const exit = {
        block: 1,
        start: 50,
        end: 200,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(50), end: new BigNum(200), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit2)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit with the same end but higher start than a range', () => {
      const exit = {
        block: 1,
        start: 25,
        end: 100,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(25), block: new BigNum(0), owner: accounts[0].address },
        { start: new BigNum(25), end: new BigNum(100), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit with a lower start and lower end than a range', () => {
      const deposit2 = {
        start: new BigNum(100),
        end: new BigNum(200),
        block: new BigNum(0),
        owner: accounts[0].address
      }
      const exit = {
        block: 1,
        start: 50,
        end: 150,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(50), end: new BigNum(150), block: new BigNum(1), owner: constants.NULL_ADDRESS },
        { start: new BigNum(150), end: new BigNum(200), block: new BigNum(0), owner: accounts[0].address }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit2)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit with a higher start and higher end than a range', () => {
      const deposit2 = {
        start: new BigNum(100),
        end: new BigNum(200),
        block: new BigNum(0),
        owner: accounts[0].address
      }
      const exit = {
        block: 1,
        start: 150,
        end: 250,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(100), end: new BigNum(150), block: new BigNum(0), owner: accounts[0].address },
        { start: new BigNum(150), end: new BigNum(250), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit2)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit with higher start and lower end than a range', () => {
      const exit = {
        block: 1,
        start: 25,
        end: 75,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(25), block: new BigNum(0), owner: accounts[0].address },
        { start: new BigNum(75), end: new BigNum(100), block: new BigNum(0), owner: accounts[0].address },
        { start: new BigNum(25), end: new BigNum(75), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit that completely overlaps a range', () => {
      const deposit2 = {
        start: new BigNum(100),
        end: new BigNum(200),
        block: new BigNum(0),
        owner: accounts[0].address
      }
      const exit = {
        block: 1,
        start: 50,
        end: 250,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(50), end: new BigNum(250), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit2)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit that overlaps two ranges', () => {
      const deposit2 = {
        start: new BigNum(100),
        end: new BigNum(200),
        block: new BigNum(0),
        owner: accounts[0].address
      }
      const exit = {
        block: 1,
        start: 0,
        end: 200,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(200), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyDeposit(deposit2)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })

    it('should be able to apply an exit that partially overlaps two ranges', () => {
      const deposit2 = {
        start: new BigNum(100),
        end: new BigNum(200),
        block: new BigNum(0),
        owner: accounts[0].address
      }
      const exit = {
        block: 1,
        start: 50,
        end: 150,
        exiter: accounts[0].address
      }
      const expected = [
        { start: new BigNum(0), end: new BigNum(50), block: new BigNum(0), owner: accounts[0].address },
        { start: new BigNum(150), end: new BigNum(200), block: new BigNum(0), owner: accounts[0].address },
        { start: new BigNum(50), end: new BigNum(150), block: new BigNum(1), owner: constants.NULL_ADDRESS }
      ]

      const snapshotManager = new SnapshotManager()
      snapshotManager.applyDeposit(deposit)
      snapshotManager.applyDeposit(deposit2)
      snapshotManager.applyExit(exit)

      snapshotManager._equals(expected).should.be.true
    })
  })
})
