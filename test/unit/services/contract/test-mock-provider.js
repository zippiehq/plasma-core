const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const utils = require('plasma-utils')
const BigNum = require('bn.js')

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

const MockContractProvider = require('../../../../src/services/contract').MockContractProvider
const app = require('../../../mock-app')

describe('MockContractProvider', async () => {
  let contract
  const deposit = {
    token: new BigNum('0', 'hex'),
    amount: new BigNum(100),
    owner: utils.constants.ACCOUNTS[0].address
  }

  before(async () => {
    await app.reset()
  })

  beforeEach(async () => {
    contract = new MockContractProvider({ app: app })
  })

  after(async () => {
    await app.stop()
  })

  it('should return the current block', async () => {
    const currentBlock = await contract.getCurrentBlock()
    currentBlock.should.equal(0)
  })

  it('should allow a user to make a deposit', async () => {
    contract.emitContractEvent = sinon.fake()
    const expected = {
      token: deposit.token,
      start: new BigNum(0),
      end: deposit.amount,
      owner: deposit.owner,
      block: 0
    }
    await contract.deposit(deposit.token, deposit.amount, deposit.owner)

    contract.emitContractEvent.should.be.calledWith('Deposit', expected)
    contract.deposits[0].should.deep.equal(expected)
  })

  it('should assert that a valid deposit is valid', async () => {
    const expected = {
      token: deposit.token,
      start: new BigNum(0),
      end: deposit.amount,
      owner: deposit.owner,
      block: 0
    }
    await contract.deposit(deposit.token, deposit.amount, deposit.owner)
    const depositValid = await contract.depositValid(expected)

    depositValid.should.be.true
  })

  it('should assert that a invalid deposit is invalid', async () => {
    const expected = {
      token: deposit.token,
      start: 0,
      end: deposit.amount,
      owner: deposit.owner,
      block: 0
    }
    const depositValid = await contract.depositValid(expected)

    depositValid.should.be.false
  })

  it('should allow someone to submit a block', async () => {
    contract.emitContractEvent = sinon.fake()
    const hash = '0x0'
    const expected = {
      number: 1,
      hash: hash
    }
    await contract.submitBlock(hash)
    const currentBlock = await contract.getCurrentBlock()

    contract.emitContractEvent.should.be.calledWith('BlockSubmitted', expected)
    currentBlock.should.equal(1)
  })

  it('should allow someone to query a block', async () => {
    const hash = '0x0'
    await contract.submitBlock(hash)
    const returnedHash = await contract.getBlock(1)

    returnedHash.should.equal(hash)
  })
})
