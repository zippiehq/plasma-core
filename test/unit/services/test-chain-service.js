const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(sinonChai)

const ChainService = require('../../../src/services/chain/chain-service')
const MockWalletProvider = require('../../../src/services/wallet').MockWalletProvider
const app = require('../../mock-app')

describe('ChainService', () => {
  const chain = new ChainService({ app: app })
  const wallet = new MockWalletProvider({ app: app })

  let accounts
  before(async () => {
    await app.reset()
    await chain.start()
    await wallet.start()
    accounts = await wallet.getAccounts()
  })

  after(async () => {
    await app.stop()
  })

  it('should return the balances of an address', async () => {
    const balances = await chain.getBalances(accounts[0])
    balances.should.deep.equal({})
  })

  it('should allow deposits', async () => {
    const expected = { token: '0x0', start: 0, end: 100, block: undefined }
    const deposit = { ...expected, owner: accounts[0] }
    app.services.rangeManager.addRange = sinon.fake()
    await chain.addDeposit(deposit)

    app.services.rangeManager.addRange.should.be.calledWith(deposit.owner, expected)
  })
})
