const chai = require('chai')
const Plasma = require('../src/plasma')
const should = chai.should()

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
    should.not.Throw(() => {
      core.startServices()
    })
  })
})
