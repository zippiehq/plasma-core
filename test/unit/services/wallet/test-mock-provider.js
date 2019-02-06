const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

const Web3 = require('web3')
const MockWalletProvider = require('../../../../src/services/wallet').MockWalletProvider
const app = require('../../../mock-app')

const web3 = new Web3()

describe('MockWalletProvider', async () => {
  const wallet = new MockWalletProvider({ app: app })

  let accounts
  before(async () => {
    await app.reset()
    await wallet.start()
    accounts = await wallet.getAccounts()
  })

  after(async () => {
    await app.stop()
  })

  it('should generate ten accounts', () => {
    accounts.should.have.lengthOf(10)
  })

  it('should allow creating new accounts', async () => {
    const account = await wallet.createAccount()
    const accounts = await wallet.getAccounts()

    accounts.should.have.lengthOf(11)
    accounts.should.include(account)
  })

  it('should be able to sign some data', async () => {
    const signature = await wallet.sign(accounts[0], 'Hello!')
    const address = web3.eth.accounts.recover('Hello!', signature.signature)

    address.should.equal(accounts[0])
  })

  it('should throw if signing with an invalid account', async () => {
    await wallet.sign('0x0', 'Hello!').should.be.rejectedWith('Account not found')
  })
})
