const chai = require('chai')

chai.should()

const GuardService = require('../../../src/services/guard-service')
const app = require('../../mock-app')

describe('GuardService', async () => {
  const guard = new GuardService({ app: app })

  beforeEach(async () => {
    await app.reset()
    await guard.start()
  })

  afterEach(async () => {
    await guard.stop()
  })

  after(async () => {
    await app.stop()
  })

  it('should start correctly', () => {
    guard.started.should.be.true
  })

  it('should have a name', () => {
    guard.name.should.equal('guard')
  })

  it('should have dependencies', () => {
    guard.dependencies.should.deep.equal(['eventHandler'])
  })
})
