const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

const Web3 = require('web3')
const Web3WalletProvider = require('../../../../src/services/wallet').Web3WalletProvider
const app = require('../../../mock-app')

const web3 = new Web3()

describe('Web3WalletProvider', async () => {
  const wallet = new Web3WalletProvider({ app: app })

  before(async () => {
    await app.startEth()
    await app.reset()
  })

  after(async () => {
    await app.stop()
    await app.stopEth()
  })

  it('should return dependencies', async () => {
    const dependencies = wallet.dependencies
    dependencies.should.deep.equal(['web3'])
  })

  it('should be able to get available accounts', async () => {
    const accounts = await wallet.getAccounts()
    accounts.should.have.lengthOf(10)
  })

  it('should be able to create an account', async () => {
    const account = await wallet.createAccount('password')
    const accounts = await wallet.getAccounts()

    accounts.should.have.lengthOf(11)
    accounts.should.include(account)
  })

  it('should be able to sign some data', async () => {
    const accounts = await wallet.getAccounts()
    const signature = await wallet.sign(accounts[0], 'Hello!')
    const address = web3.eth.accounts.recover('Hello!', signature.signature)

    address.should.equal(accounts[0])
  })

  it('should throw if signing with an invalid account', async () => {
    await wallet.sign('0x0000000000000000000000000000000000000000', 'Hello!').should.be.rejectedWith('no private key')
  })
})
