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
    range = new RangeManagerService({
      app: app,
    })
    wallet = new MockWalletProvider({
      app: app,
    })
    bob = (await wallet.getAccounts())[0]
  })

  describe('getOwnedRanges(address)', () => {
    it('should return owned ranges for address', async () => {
      const ownedRanges = [[10, 100]]
      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)
      range.getOwnedRanges(bob).should.eventually.equal(ownedRanges)
      app.services.db.get.should.be.calledWith(`ranges:${bob}`)
    })
  })

  describe('ownsRange(address, range)', () => {
    beforeEach(async () => {
      const ownedRanges = [[10, 100]]
      // Mock db methods
      app.services.db.get = sinon.fake.returns(ownedRanges)
    })

    it('should return true for a range the address owns', async () => {
      const toCheck = [30, 50]
      range.ownsRange(bob, toCheck).should.eventually.be.ok
    })

    it('should return false for a range the address does not own', async () => {
      const toCheck = [150, 200]
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })

    it('should return false for a range that partial intersects an owned range start', async () => {
      const toCheck = [0, 11]
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })

    it('should return false for a range that partial intersects an owned range end', async () => {
      const toCheck = [50, 110]
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })

    it('should return false for a range that contains an owned range end', async () => {
      const toCheck = [0, 110]
      range.ownsRange(bob, toCheck).should.eventually.not.be.ok
    })
  })

  describe('pickRanges(address, amount)', () => {
    it('should pick single range', async () => {
      const amount = 5
      const existing = [[0, 25], [30, 50], [80, 85], [200, 250]]
      const expectation = [[80, 85]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, amount).should.eventually.eql(expectation)
    })

    it('should pick partial range', async () => {
      const amount = 50
      const existing = [[200, 300]]
      const expectation = [[200, 250]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, amount).should.eventually.eql(expectation)
    })

    it('should pick multiple ranges', async () => {
      const amount = 50
      const existing = [[0, 10], [30, 50], [80, 100], [200, 250]]
      const expectation = [[0, 10], [30, 50], [80, 100]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, amount).should.eventually.eql(expectation)
    })

    it('should pick multiple ranges with partial', async () => {
      const amount = 55
      const existing = [[0, 10], [30, 50], [80, 100], [200, 250]]
      const expectation = [[0, 10], [30, 50], [80, 100], [200, 205]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      range.pickRanges(bob, amount).should.eventually.eql(expectation)
    })
  })

  describe('addRanges(address, ranges)', () => {
    it('should add a range for address who owns no existing ranges', async () => {
      const toAdd = [0, 100]
      const expectation = [toAdd]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns([])

      const ranges = await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should add a range for address who owns existing ranges', async () => {
      const toAdd = [0, 100]
      const existing = [[200, 205]]
      const expectation = [toAdd, ...existing]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      const ranges = await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should throw if a range starting below 0 is provided', async () => {
      const toAdd = [-50, 100]
      await range.addRange(bob, toAdd).should.be.rejected
    })

    it('should collapse when adding a range that intersects with end of an existing range', async () => {
      const toAdd = [80, 100]
      const existing = [[0, 80], [200, 210]]
      const expectation = [[0, 100], [200, 210]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      const ranges = await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should collapse when adding a range that intersects with start of an existing range', async () => {
      const toAdd = [110, 200]
      const existing = [[0, 80], [200, 210]]
      const expectation = [[0, 80], [110, 210]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      const ranges = await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should collapse a range when new range ends at next range start', async () => {
      const toAdd = [100, 200]
      const existing = [[0, 99], [200, 205]]
      const expectation = [[0, 99], [100, 205]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      const ranges = await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should collapse three ranges to one when adding a range that spans between two existing ranges', async () => {
      const toAdd = [80, 200]
      const existing = [[0, 80], [200, 210]]
      const expectation = [[0, 210]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      const ranges = await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should insert a range at correct index', async () => {
      const toAdd = [100, 150]
      const existing = [[0, 80], [81, 82], [93, 97], [200, 210]]
      const expectation = [[0, 80], [81, 82], [93, 97], [100, 150], [200, 210]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      const ranges = await range.addRange(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })

    it('should correctly insert ranges provided out of order', async () => {
      const toAdd = [[250, 300], [81, 82], [100, 150], [85, 90]]
      const existing = [[0, 80], [200, 210]]
      const expectation = [[0, 80], [81, 82], [85, 90], [100, 150], [200, 210], [250, 300]]

      // Mock db methods
      app.services.db.set = sinon.fake()
      app.services.db.get = sinon.fake.returns(existing)

      const ranges = await range.addRanges(bob, toAdd)
      app.services.db.set.should.be.calledWith(`ranges:${bob}`, expectation)
    })
  })
})
