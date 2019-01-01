const assert = require('chai').assert
const Web3 = require('web3')
const MockWalletProvider = require('../../../src/services/wallet/providers/mock-provider')
const app = require('../../mock-app')

const web3 = new Web3()

describe('MockWalletProvider', async () => {
  const wallet = new MockWalletProvider({
    app: app
  })
  const accounts = await wallet.getAccounts()
  it('should generate ten accounts', async () => {
    assert.lengthOf(accounts, 10, 'wallet has ten accounts')
  })
  it('should be able to sign some data', async () => {
    const signature = await wallet.sign(accounts[0], 'Hello!')
    const address = web3.eth.accounts.recover('Hello!', signature.signature)
    assert.strictEqual(address, accounts[0], 'wallet produced a valid signature')
  })
})
