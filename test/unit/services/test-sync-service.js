const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)

const SyncService = require('../../../src/services/sync-service')
const app = require('../../mock-app')

describe('SyncService', async () => {
  const sync = new SyncService({ app: app })

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

  it('should react to new deposits', () => {
    const deposit = { token: '0x0', start: 0, end: 100, owner: '0x123' }
    app.services.chain.addDeposit = sinon.fake()
    app.services.contract.emit('event:Deposit', deposit)

    app.services.chain.addDeposit.should.be.calledWith(deposit)
  })
})
