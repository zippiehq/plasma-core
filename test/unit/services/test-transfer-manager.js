const chai = require('chai')
const should = chai.should()

const TransferManager = require('../../../src/services/chain/transfer-manager')
const MockWalletProvider = require('../../../src/services/wallet')
  .MockWalletProvider
const app = require('../../mock-app')

describe('TransferManager', async () => {
  const wallet = new MockWalletProvider({ app: app })
  let bob, transferManager

  beforeEach(async () => {
    await app.reset()
    await wallet.start()

    transferManager = new TransferManager()
    bob = (await wallet.getAccounts())[0]
  })

  afterEach(async () => {
    await wallet.stop()
  })

  after(async () => {
    await app.stop()
  })

  describe('canSpend(address, token, amount)', () => {
    it('should return true when user has large enough balance to spend amount', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 10, end: 100 }]
      const amount = 50
      const token = '0xdeadbeef'

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.canSpend(bob, token, amount).should.be.true
    })

    it('should return true when user has large enough balance to spend amount', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 10, end: 20 },
        { token: '0xdeadbeef', start: 30, end: 40 },
        { token: '0xdeadbeef', start: 50, end: 80 }
      ]
      const amount = 50
      const token = '0xdeadbeef'

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.canSpend(bob, token, amount).should.be.true
    })

    it('should return false when user does not have large enough balance to spend amount', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 10, end: 100 }]
      const amount = 100
      const token = '0xdeadbeef'

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.canSpend(bob, token, amount).should.be.false
    })
  })

  describe('getOwnedTransfers(address)', () => {
    it('should return owned transfers for address', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 10, end: 100 }]
      const expectation = transferManager._castTransfers(ownedTransfers)

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.getOwnedTransfers(bob).should.deep.equal(expectation)
    })
  })

  describe('ownsTransfer(address, transfer)', () => {
    beforeEach(async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 10, end: 100 }]

      transferManager.addTransfers(bob, ownedTransfers)
    })

    it('should return true for a transfer the address owns', async () => {
      const toCheck = { token: '0xdeadbeef', start: 30, end: 50 }

      transferManager.ownsTransfer(bob, toCheck).should.be.true
    })

    it('should return false for a transfer the address does not own', async () => {
      const toCheck = { token: '0xdeadbeef', start: 150, end: 200 }

      transferManager.ownsTransfer(bob, toCheck).should.be.false
    })

    it('should return false for a transfer that partial intersects an owned transfer start', async () => {
      const toCheck = { token: '0xdeadbeef', start: 0, end: 11 }

      transferManager.ownsTransfer(bob, toCheck).should.be.false
    })

    it('should return false for a transfer that partial intersects an owned transfer end', async () => {
      const toCheck = { token: '0xdeadbeef', start: 50, end: 110 }

      transferManager.ownsTransfer(bob, toCheck).should.be.false
    })

    it('should return false for a transfer that contains an owned transfer end', async () => {
      const toCheck = { token: '0xdeadbeef', start: 0, end: 110 }

      transferManager.ownsTransfer(bob, toCheck).should.be.false
    })
  })

  describe('pickTransfers(address, token, amount)', () => {
    it('should pick single transfer', async () => {
      const amount = 5
      const token = '0xdeadbeef'
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 25 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 85 },
        { token: '0xdeadbeef', start: 200, end: 250 }
      ]
      const expectation = transferManager._castTransfers([{ token: '0xdeadbeef', start: 80, end: 85 }])

      transferManager.addTransfers(bob, ownedTransfers)

      transferManager.pickTransfers(bob, token, amount).should.deep.equal(expectation)
    })

    it('should pick partial transfer', async () => {
      const amount = 50
      const token = '0xdeadbeef'
      const ownedTransfers = [{ token: '0xdeadbeef', start: 200, end: 300 }]
      const expectation = transferManager._castTransfers([{ token: '0xdeadbeef', start: 200, end: 250 }])

      transferManager.addTransfers(bob, ownedTransfers)

      transferManager.pickTransfers(bob, token, amount).should.deep.equal(expectation)
    })

    it('should pick multiple transfers', async () => {
      const amount = 50
      const token = '0xdeadbeef'
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 250 }
      ]
      const expectation = transferManager._castTransfers([
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)

      transferManager.pickTransfers(bob, token, amount).should.deep.equal(expectation)
    })

    it('should pick multiple transfers with partial', async () => {
      const amount = 55
      const token = '0xdeadbeef'
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 250 }
      ]
      const expectation = transferManager._castTransfers([
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 },
        { token: '0xdeadbeef', start: 80, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 205 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)

      transferManager.pickTransfers(bob, token, amount).should.deep.equal(expectation)
    })

    it('should should throw when not enough transfers owned to cover amount', async () => {
      const amount = 50
      const token = '0xdeadbeef'
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 30, end: 50 }
      ]

      transferManager.addTransfers(bob, ownedTransfers)

      should.Throw(() => {
        transferManager.pickTransfers(bob, token, amount)
      })
    })
  })

  describe('addTransfer(address, transfer)', () => {
    it('should add a transfer for address who owns no existing transfers', async () => {
      const toAdd = { token: '0xdeadbeef', start: 0, end: 100 }
      const expectation = transferManager._castRanges([toAdd])

      transferManager.addTransfer(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should add a transfer for address who owns existing transfers', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 200, end: 205 }]
      const toAdd = { token: '0xdeadbeef', start: 0, end: 100 }
      const expectation = transferManager._castRanges([toAdd, ...ownedTransfers])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.addTransfer(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should throw if a transfer starting below 0 is provided', async () => {
      const toAdd = { token: '0xdeadbeef', start: -50, end: 100 }
      should.Throw(() => {
        transferManager.addTransfer(bob, toAdd)
      })
    })

    it('should collapse when adding a transfer that intersects with end of an existing transfer', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const toAdd = { token: '0xdeadbeef', start: 80, end: 100 }
      const expectation = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 100 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.addTransfer(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should collapse when adding a transfer that intersects with start of an existing transfer', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const toAdd = { token: '0xdeadbeef', start: 110, end: 200 }
      const expectation = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 110, end: 210 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.addTransfer(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should collapse a transfer when new transfer ends at next transfer start', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 99 },
        { token: '0xdeadbeef', start: 200, end: 205 }
      ]
      const toAdd = { token: '0xdeadbeef', start: 100, end: 200 }
      const expectation = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 99 },
        { token: '0xdeadbeef', start: 100, end: 205 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.addTransfer(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should collapse three transfers to one when adding a transfer that spans between two existing transfers', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const toAdd = { token: '0xdeadbeef', start: 80, end: 200 }
      const expectation = transferManager._castRanges([{ token: '0xdeadbeef', start: 0, end: 210 }])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.addTransfer(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should insert a transfer at correct index', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 93, end: 97 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const toAdd = { token: '0xdeadbeef', start: 100, end: 150 }
      const expectation = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 93, end: 97 },
        { token: '0xdeadbeef', start: 100, end: 150 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.addTransfer(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })
  })

  describe('addTransfers(address, transfers)', () => {
    it('should correctly insert transfers provided out of order', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 200, end: 210 }
      ]
      const toAdd = [
        { token: '0xdeadbeef', start: 250, end: 300 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 100, end: 150 },
        { token: '0xdeadbeef', start: 85, end: 90 }
      ]
      const expectation = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 80 },
        { token: '0xdeadbeef', start: 81, end: 82 },
        { token: '0xdeadbeef', start: 85, end: 90 },
        { token: '0xdeadbeef', start: 100, end: 150 },
        { token: '0xdeadbeef', start: 200, end: 210 },
        { token: '0xdeadbeef', start: 250, end: 300 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.addTransfers(bob, toAdd)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })
  })

  describe('removeTransfer(address, transfer)', () => {
    it('should remove a transfer for address where full transfer is removed', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 0, end: 200 }
      const expectation = []

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.removeTransfer(bob, toRemove)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should remove a transfer for address where partial transfer is removed', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 100, end: 150 }
      const expectation = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 100 },
        { token: '0xdeadbeef', start: 150, end: 200 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.removeTransfer(bob, toRemove)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should remove a transfer for address where start of a transfer is removed', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 0, end: 100 }
      const expectation = transferManager._castRanges([{ token: '0xdeadbeef', start: 100, end: 200 }])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.removeTransfer(bob, toRemove)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should remove a transfer for address where end of a transfer is removed', async () => {
      const ownedTransfers = [{ token: '0xdeadbeef', start: 0, end: 200 }]
      const toRemove = { token: '0xdeadbeef', start: 100, end: 200 }
      const expectation = transferManager._castRanges([{ token: '0xdeadbeef', start: 0, end: 100 }])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.removeTransfer(bob, toRemove)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })
  })

  describe('removeTransfers(address, transfers)', () => {
    it('should remove transfers for address', async () => {
      const ownedTransfers = [
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 25, end: 200 },
        { token: '0xdeadbeef', start: 250, end: 350 },
        { token: '0xdeadbeef', start: 500, end: 600 }
      ]
      const toRemove = [
        { token: '0xdeadbeef', start: 25, end: 100 },
        { token: '0xdeadbeef', start: 250, end: 349 }
      ]
      const expectation = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 10 },
        { token: '0xdeadbeef', start: 100, end: 200 },
        { token: '0xdeadbeef', start: 349, end: 350 },
        { token: '0xdeadbeef', start: 500, end: 600 }
      ])

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.removeTransfers(bob, toRemove)

      transferManager.getOwnedRanges(bob).should.deep.equal(expectation)
    })

    it('should do nothing when to remove a transfer the user does not own', async () => {
      const ownedTransfers = transferManager._castRanges([
        { token: '0xdeadbeef', start: 0, end: 200 },
        { token: '0xdeadbeef', start: 250, end: 350 },
        { token: '0xdeadbeef', start: 500, end: 600 }
      ])
      const toRemove = [{ token: '0xdeadbeef', start: 220, end: 225 }]

      transferManager.addTransfers(bob, ownedTransfers)
      transferManager.removeTransfers(bob, toRemove)

      transferManager.getOwnedRanges(bob).should.deep.equal(ownedTransfers)
    })
  })
})
