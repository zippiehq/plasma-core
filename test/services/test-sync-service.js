const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)

const SyncService = require('../../src/services/sync-service')
const app = require('../mock-app')

const EMPTY_BLOCK_HASH = '0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffff'

describe('SyncService', async () => {
  const sync = new SyncService({ app: app })

  beforeEach(async () => {
    await app.reset()
    app.registerService(sync)

    await sync.start()
  })

  afterEach(async () => {
    await sync.stop()
  })

  it('should add new blocks to the database automatically', async () => {
    app.services.chain.addBlockHeader = sinon.fake()
    await app.services.eth.contract.submitBlock(EMPTY_BLOCK_HASH)

    app.services.chain.addBlockHeader.should.be.calledWith(0, EMPTY_BLOCK_HASH)
  })
})
