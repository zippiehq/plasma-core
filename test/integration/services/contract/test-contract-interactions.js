const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const utils = require('plasma-utils')
const compiledContracts = require('plasma-contracts')
const serializerCompiled = compiledContracts.serializerCompiled
const plasmaChainCompiled = compiledContracts.plasmaChainCompiled

chai.should()
chai.use(chaiAsPromised)
chai.use(sinonChai)

const services = require('../../../../src/services')
const HttpContractProvider = services.ContractProviders.HttpContractProvider
const EventWatcherService = services.EventWatcherService
const app = require('../../../mock-app')

const ETH = 0
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

const initSerializer = async (web3, operator) => {
  const serializer = new web3.eth.Contract(serializerCompiled.abi)
  const deployed = await serializer.deploy({
    data: plasmaChainCompiled.bytecode
  }).send({
    from: operator,
    gas: 7000000,
    gasPrice: '1'
  })
  return deployed.options.address
}

describe('Contract Interactions', () => {
  let contract
  let operator
  let watcher

  before(async () => {
    // Reset and start Ethereum.
    await app.startEth()
    await app.reset()

    // Pick an account to be the operator.
    operator = (await app.services.web3.eth.getAccounts())[0]

    const serializer = await initSerializer(app.services.web3, operator)

    contract = new HttpContractProvider({ app: app })
    watcher = new EventWatcherService({ app: app, finalityDepth: 0 })
    app.services.contract = contract
    contract.initContract()

    // Deploy and initialize the contract.
    const deployed = await contract.contract.deploy({
      data: plasmaChainCompiled.bytecode
    }).send({
      from: operator,
      gas: 7000000,
      gasPrice: '1'
    })
    contract.contract.options.address = deployed.options.address
    await contract.contract.methods.setup(operator, 0, serializer).send({
      from: operator,
      gas: 7000000
    })

    await contract.start()
    await watcher.start()
  })

  after(async () => {
    await watcher.stop()
    await app.stop()
    await app.stopEth()
  })

  describe('HttpContractProvider', async () => {
    it('should return the current block', async () => {
      const currentBlock = await contract.getCurrentBlock()
      currentBlock.should.equal(0)
    })

    it('should return the current operator', async () => {
      const returnedOperator = await contract.getOperator()
      returnedOperator.should.equal(operator)
    })

    it('should allow a user to create a deposit', async () => {
      await contract.deposit(ETH, 100, operator)
    })

    it('should allow the operator to submit a block', async () => {
      await contract.submitBlock(ZERO_HASH)
    })

    it('should allow a user to query a block', async () => {
      const hash = await contract.getBlock(0)
      hash.should.equal(ZERO_HASH)
    })
  })

  describe('EventWatcherService', async () => {
    it('should detect a new deposit', async () => {
      let fake = sinon.fake()
      watcher.subscribe('DepositEvent', (event) => {
        fake({
          owner: event.returnValues.depositer,
          start: event.returnValues.untypedStart,
          end: event.returnValues.untypedEnd,
          token: event.returnValues.tokenType
        })
      })
      await contract.deposit(ETH, 100, operator)
      const expected = { owner: operator, start: '100', end: '200', token: '0' }

      // Wait so the event can be detected.
      await utils.utils.sleep(200)

      fake.should.be.calledWith(expected)
    })

    it('should detect a new block', async () => {
      let fake = sinon.fake()
      watcher.subscribe('SubmitBlockEvent', (event) => {
        fake({
          block: event.returnValues.blockNumber,
          hash: event.returnValues.submittedHash
        })
      })
      await contract.submitBlock(ZERO_HASH)
      const currentBlock = await contract.getCurrentBlock()
      const expected = { block: currentBlock.toString(), hash: ZERO_HASH }

      // Wait so the event can be detected.
      await utils.utils.sleep(200)

      fake.should.be.calledWith(expected)
    })
  })
})
