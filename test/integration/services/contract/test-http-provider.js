const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

const HttpContractProvider = require('../../../../src/services/contract').HttpContractProvider
const app = require('../../../mock-app')

describe('HttpContractProvider', async () => {
  let contract

  before(async () => {
    await app.reset()
  })

  beforeEach(async () => {
    contract = new HttpContractProvider({ app: app })
    await contract.start()
  })

  after(async () => {
    await app.stop()
  })

  it('should return the current block', async () => {
    contract.contract.methods.nextPlasmaBlockNumber = sinon.fake.returns({
      call: () => { return 1 }
    })
    const currentBlock = await contract.getCurrentBlock()
    currentBlock.should.equal(0)
  })
})
