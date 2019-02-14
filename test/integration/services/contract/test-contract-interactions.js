const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const utils = require('plasma-utils')
const compiledContracts = require('plasma-contracts')

chai.should()
chai.use(chaiAsPromised)
chai.use(sinonChai)

const services = require('../../../../src/services')
const ContractProvider = services.ContractProviders.ContractProvider
const app = require('../../../mock-app')

const ETH = 0
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

const hexify = (value, length) => {
  return utils.utils.web3Utils.asciiToHex(value).padEnd((length * 2) + 2, '0')
}

const deployContract = async (web3, deployer, compiled) => {
  const contract = new web3.eth.Contract(compiled.abi)
  const deployed = await contract.deploy({
    data: compiled.bytecode
  }).send({
    from: deployer,
    gas: 7000000,
    gasPrice: '1'
  })
  return deployed
}

const deployPlasmaChain = async (web3, operator, name, ip) => {
  name = hexify(name, 32)
  ip = hexify(ip, 32)

  const serializer = await deployContract(web3, operator, compiledContracts.serializerCompiled)
  const template = await deployContract(web3, operator, compiledContracts.plasmaChainCompiled)
  const registry = await deployContract(web3, operator, compiledContracts.plasmaRegistryCompiled)

  await registry.methods.initializeRegistry(template.options.address, serializer.options.address).send({
    from: operator,
    gas: 7000000
  })
  const receipt = await registry.methods.createPlasmaChain(operator, name, ip).send({
    from: operator,
    gas: 7000000
  })
  const plasmaChainAddress = receipt.events.NewPlasmaChain.returnValues['PlasmaChainAddress']
  const registryAddress = registry.options.address
  return {
    plasmaChainAddress,
    registryAddress
  }
}

describe('Contract Interactions', () => {
  let contract
  let operator
  let watcher
  let web3

  before(async () => {
    // Reset and start Ethereum.
    await app.startEth()
    await app.reset()

    watcher = app.services.eventWatcher
    web3 = app.services.web3

    await watcher.stop()

    // Pick an account to be the operator.
    operator = (await web3.eth.getAccounts())[0]

    const { registryAddress } = await deployPlasmaChain(web3, operator, 'testchain', '0.0.0.0')

    contract = new ContractProvider({
      app: app,
      plasmaChainName: 'testchain',
      registryAddress: registryAddress
    })
    app.services.contract = contract

    await contract.start()
    await new Promise((resolve) => {
      contract.on('initialized', () => {
        resolve()
      })
    })
    await watcher.start()
  })

  after(async () => {
    await watcher.stop()
    await app.stop()
    await app.stopEth()
  })

  describe('ContractProvider', async () => {
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
      watcher.subscribe('DepositEvent', (events) => {
        const event = events[0]
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
      watcher.subscribe('SubmitBlockEvent', (events) => {
        // first block is from above test
        if (events[0].blockNumber === '1') return

        const event = events[0]
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
