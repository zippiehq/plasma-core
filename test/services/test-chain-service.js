const chai = require('chai')
chai.should()

const ChainService = require('../../src/services/chain-service')
const MockWalletProvider = require('../../src/services/wallet').MockWalletProvider
const app = require('../mock-app')

describe('ChainService', async () => {
  const chain = new ChainService({
    app: app
  })
  const wallet = new MockWalletProvider({
    app: app
  })
  wallet.start()

  const accounts = await wallet.getAccounts()

  it('should return the balances of an address', async () => {
    const balances = await chain.getBalances(accounts[0])
    balances.should.deep.equal({})
  })
})
