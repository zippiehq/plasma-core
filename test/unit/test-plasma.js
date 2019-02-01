const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const Plasma = require('../../src/plasma')

chai.should()
chai.use(chaiAsPromised)

describe('Plasma Core', () => {
  const core = new Plasma({
    eventPollInterval: 100,
    transactionPollInterval: 100
  })

  afterEach(async () => {
    await core.stop()
  })

  it('should run', async () => {
    await core.start().should.eventually.be.fulfilled
  })

  it('should stop', async () => {
    await core.start()
    await core.stop().should.eventually.be.fulfilled
  })
})
