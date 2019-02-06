const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)

const Web3Provider = require('../../../src/services/web3-provider')
const app = require('../../mock-app')

describe('Web3Provider', async () => {
  let web3 = new Web3Provider()

  beforeEach(async () => {
    await app.reset()
    await web3.start()
  })

  afterEach(async () => {
    await web3.stop()
  })

  after(async () => {
    await web3.stop()
  })

  it('should start correctly', () => {
    web3.started.should.be.true
  })

  it('should stop correctly if the provider is defined', async () => {
    web3.provider = { removeAllListeners: sinon.fake() }

    await web3.stop()

    web3.started.should.be.false
    web3.provider.removeAllListeners.should.be.calledOnce
  })

  it('should stop correctly if the provider is undefined', async () => {
    web3.provider = undefined

    await web3.stop()
    web3.started.should.be.false
  })
})
