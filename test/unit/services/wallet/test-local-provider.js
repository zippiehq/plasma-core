const fs = require('fs')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')
const appRoot = require('app-root-path')

chai.should()
chai.use(chaiAsPromised)

const Web3 = require('web3')
const LocalWalletProvider = require('../../../../src/services/wallet').LocalWalletProvider
const app = require('../../../mock-app')

const web3 = new Web3()

describe('LocalWalletProvider', async () => {
  const dbtestDir = path.join(appRoot.toString(), '.db_tests/')
  if (!fs.existsSync(dbtestDir)) {
    fs.mkdirSync(dbtestDir)
  }

  const keystoreDir = path.join(dbtestDir, new Date().getTime().toString())
  const wallet = new LocalWalletProvider({ app: app, keystoreDir: keystoreDir })

  before(async () => {
    await app.reset()
    await wallet.start()
  })

  after(async () => {
    await app.stop()
  })

  it('should return dependencies', () => {
    const dependencies = wallet.dependencies
    dependencies.should.deep.equal(['web3', 'db'])
  })

  it('should allow creating new accounts', async () => {
    const account = await wallet.createAccount()
    const accounts = await wallet.getAccounts()

    accounts.should.have.lengthOf(1)
    accounts.should.include(account)
  })

  it('should be able to sign some data', async () => {
    const accounts = await wallet.getAccounts()

    const signature = await wallet.sign(accounts[0], 'Hello!')
    const address = web3.eth.accounts.recover('Hello!', signature.signature)

    address.should.equal(accounts[0])
  })

  it('should not add an account to the wallet that has already been added', async () => {
    const accounts = await wallet.getAccounts()
    wallet.addAccountToWallet(accounts[0])
  })

  it('should throw if signing with an invalid account', async () => {
    wallet.sign('0x0', 'Hello!').should.be.rejectedWith('Account not found')
  })
})
