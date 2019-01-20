const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const Plasma = require('../src/plasma')

chai.should()
chai.use(chaiAsPromised)

describe('Plasma Core', () => {
  const core = new Plasma({
    logger: {
      log: () => {
        return true
      }
    }
  })

  afterEach(() => {
    core.stopServices()
  })

  it('should run', async () => {
    await core.startServices().should.eventually.be.fulfilled
  })
})
