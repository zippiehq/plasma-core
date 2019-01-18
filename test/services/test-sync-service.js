const chai = require('chai')

chai.should()

const SyncService = require('../../src/services/sync-service')
const app = require('../mock-app')

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

  it('should start correctly', () => {
    sync.started.should.be.true
  })
})
