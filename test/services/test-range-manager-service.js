const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

const RangeManagerService = require('../../src/services/range-manager-service')
const MockWalletProvider = require('../../src/services/wallet')
  .MockWalletProvider
const app = require('../mock-app')

describe('RangeManagerService', async () => {
  let range, wallet, bob
  beforeEach(async () => {
    range = new RangeManagerService({ app: app })
    wallet = new MockWalletProvider({ app: app })
    wallet.start()

    bob = (await wallet.getAccounts())[0]
  })

  describe('name', () => {
    it('should return correct service name', async () => {
      const expecation = 'rangeManager'

      range.name.should.equal(expecation)
    })
  })

  describe('canSpend(address, token, amount)', () => {
    it('should return true when user has large enough balance to spend amount', async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 10, end: 100 }]
      const amount = 50
      const token = '0xdeadbeef'

      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)
      range.canSpend(bob, token, amount).should.eventually.be.ok
    })

    it('should return true when user has large enough balance to spend amount', async () => {
      const ownedRanges = [
        { token: '0xdeadbeef', start: 10, end: 20 },
        { token: '0xdeadbeef', start: 30, end: 40 },
        { token: '0xdeadbeef', start: 50, end: 80 }
      ]
      const amount = 50
      const token = '0xdeadbeef'

      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)
      range.canSpend(bob, token, amount).should.eventually.be.ok
    })

    it('should return false when user does not have large enough balance to spend amount', async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 10, end: 100 }]
      const amount = 100
      const token = '0xdeadbeef'

      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)
      range.canSpend(bob, token, amount).should.eventually.not.be.ok
    })
  })

  describe('getOwnedRanges(address)', () => {
    it('should return owned ranges for address', async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 10, end: 100 }]
      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)
      range.getOwnedRanges(bob).should.eventually.equal(ownedRanges)
      app.services.db.get.should.be.calledWith(`ranges:${bob}`)
    })
  })

  describe('ownsRange(address, range)', () => {
    beforeEach(async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 10, end: 100 }]

      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)
    })

    it('should return true for a range the address owns', async () => {
      const toCheck = { token: '0xdeadbeef', start: 30, end: 50 }
      range.ownsRange(bob, toCheck).should.eventually.be.ok
    })

    it('should return false for a range the address does not own', async () => {
      const toCheck = { token: '0xdeadbeef', start: 150, end: 200 }
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })

    it('should return false for a range that partial intersects an owned range start', async () => {
      const toCheck = { token: '0xdeadbeef', start: 0, end: 11 }
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })

    it('should return false for a range that partial intersects an owned range end', async () => {
      const toCheck = { token: '0xdeadbeef', start: 50, end: 110 }
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })

    it('should return false for a range that contains an owned range end', async () => {
      const toCheck = { token: '0xdeadbeef', start: 0, end: 110 }
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })
  })

  describe('pickRanges(address, token, amount)', () => {
    it('should pick single range', async () => {
      const amount = 5
      const token = '0xdeadbeef'
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 25 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 85 },
        { token: '0xdeadbeef', start: 200, end: 250 }
      ]
      const expectation = [{ token: '0xdeadbeef', start: 80, end: 85 }]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, token, amount).should.eventually.eql(expectation)
    })

    it('should pick partial range', async () => {
      const amount = 50
      const token = '0xdeadbeef'
      const existing = [{ token: '0xdeadbeef', start: 200, end: 300 }]
      const expectation = [{ token: '0xdeadbeef', start: 200, end: 250 }]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, token, amount).should.eventually.eql(expectation)
    })

    it('should pick multiple ranges', async () => {
      const amount = 50
      const token = '0xdeadbeef'
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 250 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, token, amount).should.eventually.eql(expectation)
    })

    it('should pick multiple ranges with partial', async () => {
      const amount = 55
      const token = '0xdeadbeef'
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 250 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 205 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, token, amount).should.eventually.eql(expectation)
    })

    it('should should throw when not enough ranges owned to cover amount', async () => {
      const amount = 50
      const token = '0xdeadbeef'
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, token, amount).should.be.rejected
    })
  })

  describe('addRange(address, range)', () => {
    it('should add a range for address who owns no existing ranges', async () => {
      const toAdd = { token: '0xdeadbeef', start: 0, end: 100 }
      const expectation = [toAdd]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns([])

      await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should add a range for address who owns existing ranges', async () => {
      const toAdd = { token: '0xdeadbeef', start: 0, end: 100 }
      const existing = [{ token: '0xdeadbeef', start: 200, end: 205 }]
      const expectation = [toAdd, ...existing]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should throw if a range starting below 0 is provided', async () => {
      const toAdd = { token: '0xdeadbeef', start: -50, end: 100 }
      await range.addRange(bob, toAdd).should.be.rejected
    })

    it('should collapse when adding a range that intersects with end of an existing range', async () => {
      const toAdd = { token: '0xdeadbeef', start: 80, end: 100 }
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should collapse when adding a range that intersects with start of an existing range', async () => {
      const toAdd = { token: '0xdeadbeef', start: 110, end: 200 }
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 110, end: 210 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should collapse a range when new range ends at next range start', async () => {
      const toAdd = { token: '0xdeadbeef', start: 100, end: 200 }
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 99 },
        { token: '0xdeadbeef', start: 200, end: 205 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 99 },
        { token: '0xdeadbeef', start: 100, end: 205 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should collapse three ranges to one when adding a range that spans between two existing ranges', async () => {
      const toAdd = { token: '0xdeadbeef', start: 80, end: 200 }
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const expectation = [{ token: '0xdeadbeef', start: 0, end: 210 }]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should insert a range at correct index', async () => {
      const toAdd = { token: '0xdeadbeef', start: 100, end: 150 }
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 93, end: 97 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 93, end: 97 },
        { token: '0xdeadbeef', start: 100, end: 150 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })
  })

  describe('addRanges(address, ranges)', () => {
    it('should correctly insert ranges provided out of order', async () => {
      const toAdd = [
        { token: '0xdeadbeef', start: 250, end: 300 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 100, end: 150 },
        { token: '0xdeadbeef', start: 85, end: 90 }
      ]
      const existing = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 85, end: 90 },
        { token: '0xdeadbeef', start: 100, end: 150 },
        { token: '0xdeadbeef', start: 200, end: 210 },
        { token: '0xdeadbeef', start: 250, end: 300 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      await range.addRanges(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })
  })

  describe('removeRange(address, range)', () => {
    it('should remove a range for address where full range is removed', async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 0, end: 200 }
      const expectation = []

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(ownedRanges)

      await range.removeRange(bob, toRemove)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should remove a range for address where partial range is removed', async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 100, end: 150 }
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 100 },
        { token: '0xdeadbeef', start: 150, end: 200 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(ownedRanges)

      await range.removeRange(bob, toRemove)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should remove a range for address where start of a range is removed', async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 0, end: 100 }
      const expectation = [{ token: '0xdeadbeef', start: 100, end: 200 }]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(ownedRanges)

      await range.removeRange(bob, toRemove)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should remove a range for address where end of a range is removed', async () => {
      const ownedRanges = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 100, end: 200 }
      const expectation = [{ token: '0xdeadbeef', start: 0, end: 100 }]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(ownedRanges)

      await range.removeRange(bob, toRemove)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })
  })

  describe('removeRanges(address, ranges)', () => {
    it('should remove ranges for address', async () => {
      const ownedRanges = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 25, end: 200 },
        { token: '0xdeadbeef', start: 250, end: 350 },
        { token: '0xdeadbeef', start: 500, end: 600 }
      ]
      const toRemove = [
        { token: '0xdeadbeef', start: 25, end: 100 },
        { token: '0xdeadbeef', start: 250, end: 349 }
      ]
      const expectation = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 100, end: 200 },
        { token: '0xdeadbeef', start: 349, end: 350 },
        { token: '0xdeadbeef', start: 500, end: 600 }
      ]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(ownedRanges)

      await range.removeRanges(bob, toRemove)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should throw when trying to remove a range the user does not own', async () => {
      const ownedRanges = [
        { token: '0xdeadbeef', start: 0, end: 200 },
        { token: '0xdeadbeef', start: 250, end: 350 },
        { token: '0xdeadbeef', start: 500, end: 600 }
      ]
      const toRemove = [{ token: '0xdeadbeef', start: 220, end: 225 }]

      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)

      range.removeRanges(bob, toRemove).should.eventually.be.rejected
    })
  })
})
