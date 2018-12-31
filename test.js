/*
const PlasmaApp = require('./src/plasma-app')

const plasma = new PlasmaApp({
  dbBackend: 'ephem',
  rpcPort: '9898',
  contract: {
    abi: '',
    address: '0x0'
  }
})

const deposits = [
  {
    block: 0,
    start: 0,
    end: 50
  }
]

const history = {
  0: [
    {
      tx: {
        start: 0,
        end: 1
      },
      proof: ''
    },
    {
      tx: {
        start: 2,
        end: 50
      },
      proof: ''
    }
  ]
}

const range = {
  start: 0,
  end: 51
}

const transaction = {
  block: 1
}
*/

const Plasma = require('./src/plasma')

const plasma = new Plasma({
  dbBackend: 'ephem',
  contract: {
    abi: '',
    address: '0x0'
  },
  operatorProvider: 'mock',
  walletProvider: 'mock'
})

const test = async () => {
  try {
    const accounts = await plasma.services.wallet.getAccounts()

    const sender = accounts[0]
    const recipient = accounts[1]
    const transaction1 = {
      block: 1,
      from: sender,
      to: recipient,
      range: {
        token: 'OMG',
        start: 0,
        end: 50
      }
    }

    const transaction2 = {
      block: 2,
      from: recipient,
      to: sender,
      range: {
        token: 'OMG',
        start: 0,
        end: 0
      }
    }

    await plasma.services.chain.addTransaction(transaction1)
    const balances = await plasma.services.chain.getBalances(recipient)
    console.log(balances)
    const ranges = await plasma.services.chain.getOwnedRanges(recipient)
    console.log(ranges)
    const receipt = await plasma.services.chain.sendTransaction(transaction2)
    console.log(receipt)
    const pending = await plasma.services.operator.getPendingTransactions(sender)
    console.log(pending)
    for (let hash of pending) {
      const tx = await plasma.services.operator.getTransaction(hash)
      console.log(tx)
    }
  } catch (err) {
    console.log(err)
  }
}

test()
