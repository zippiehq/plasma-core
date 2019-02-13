const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)

const SyncService = require('../../../src/services/sync-service')
const app = require('../../mock-app')

describe('SyncService', async () => {
  const sync = new SyncService({ app: app, transactionPollInterval: 100 })

  beforeEach(async () => {
    await app.reset()
    await sync.start()
  })

  afterEach(async () => {
    await sync.stop()
  })

  after(async () => {
    await app.stop()
  })

  it('should start correctly', () => {
    sync.started.should.be.true
  })

  it('should have a name', () => {
    sync.name.should.equal('sync')
  })

  it('should have dependencies', () => {
    const dependencies = [
      'contract',
      'chain',
      'eventHandler',
      'syncdb',
      'chaindb',
      'wallet',
      'operator'
    ]
    sync.dependencies.should.deep.equal(dependencies)
  })

  it('should react to new deposits', () => {
    const deposit = { token: '0x0', start: 0, end: 100, owner: '0x123' }
    app.services.chain.addDeposits = sinon.fake()
    app.services.eventHandler.emit('event:Deposit', [deposit])

    app.services.chain.addDeposits.should.be.calledWith([deposit])
  })

  it('should react to new blocks', () => {
    const block = { hash: '0x0', number: 0 }
    app.services.chaindb.addBlockHeaders = sinon.fake()
    app.services.eventHandler.emit('event:BlockSubmitted', [block])

    app.services.chaindb.addBlockHeaders.should.be.calledWith([block])
  })

  it('should react to new exits', () => {
    const exit = { token: '0x0', start: 0, end: 100, exiter: '0x123' }
    app.services.chain.addExit = sinon.fake()
    app.services.eventHandler.emit('event:ExitStarted', [exit])

    app.services.chain.addExit.should.be.calledWith(exit)
  })

  it('should react to finalized exits', () => {
    const exit = { token: '0x0', start: 0, end: 100, exiter: '0x123' }
    app.services.chaindb.markFinalized = sinon.fake()
    app.services.eventHandler.emit('event:ExitFinalized', [exit])

    app.services.chaindb.markFinalized.should.be.calledWith(exit)
  })

  it('should be able to add new transactions', async () => {
    const tx = {
      hash: '0x0',
      transfers: [
        {
          sender: '0xdeadbeef'
        }
      ]
    }
    const fakeTxInfo = {
      transaction: undefined,
      deposits: undefined,
      proof: undefined
    }
    app.services.chaindb.hasTransaction = sinon.fake.returns(false)
    app.services.operator.getTransaction = sinon.fake.returns(fakeTxInfo)
    app.services.chain.addTransaction = sinon.fake()

    await sync._addTransaction(tx)

    app.services.chain.addTransaction.should.be.calledWith(
      fakeTxInfo.transaction,
      fakeTxInfo.deposits,
      fakeTxInfo.proof
    )
  })

  it('should not add a transaction that has already been seen', async () => {
    const tx = {
      hash: '0x0',
      transfers: [
        {
          sender: '0xdeadbeef'
        }
      ]
    }
    app.services.chaindb.hasTransaction = sinon.fake.returns(true)
    app.services.chain.addTransaction = sinon.fake()

    await sync._addTransaction(tx)

    app.services.chain.addTransaction.should.not.be.called
  })

  it('should not add a deposit', async () => {
    const tx = {
      hash: '0x0',
      transfers: [
        {
          sender: '0x0000000000000000000000000000000000000000'
        }
      ]
    }
    app.services.chain.addTransaction = sinon.fake()

    await sync._addTransaction(tx)

    app.services.chain.addTransaction.should.not.be.called
  })

  it('should throw if the operator fails to return data', async () => {
    const tx = {
      hash: '0x0',
      transfers: [
        {
          sender: '0xdeadbeef'
        }
      ]
    }
    app.services.chaindb.hasTransaction = sinon.fake.returns(false)
    app.services.operator.getTransaction = sinon.fake.rejects('ERROR')
    app.services.chain.addTransaction = sinon.fake()

    sync._addTransaction(tx).should.eventually.be.rejectedWith('ERROR')

    app.services.chain.addTransaction.should.not.be.called
  })
})
