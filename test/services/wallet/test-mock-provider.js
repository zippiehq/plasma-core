const chai = require('chai')
chai.should()

const Web3 = require('web3')
const MockWalletProvider = require('../../../src/services/wallet').MockWalletProvider
const app = require('../../mock-app')

const web3 = new Web3()

describe('MockWalletProvider', async () => {
  const wallet = new MockWalletProvider({ app: app })
  const accounts = await wallet.getAccounts()

  it('should generate ten accounts', () => {
    accounts.should.have.lengthOf(10)
  })

  it('should be able to sign some data', async () => {
    const signature = await wallet.sign(accounts[0], 'Hello!')
    const address = web3.eth.accounts.recover('Hello!', signature.signature)

    address.should.equal(accounts[0])
  })
})
