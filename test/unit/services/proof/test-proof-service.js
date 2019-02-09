const chai = require('chai')
const BigNum = require('bn.js')
const _ = require('lodash')
const Web3 = require('web3')
const utils = require('plasma-utils')

const web3 = new Web3()
const UnsignedTransaction = utils.serialization.models.UnsignedTransaction
chai.should()

const ProofService = require('../../../../src/services/chain/proof-service')
const MockContractProvider = require('../../../../src/services/contract/mock-provider')

const app = require('../../../mock-app')
const constants = utils.constants
const accounts = constants.ACCOUNTS

/* Helper functions */
const submitDeposits = async (deposits) => {
  for (let deposit of deposits) {
    await app.services.contract.deposit(0, deposit.end - deposit.start, deposit.owner)
  }
}

const submitBlocks = async (blocks) => {
  for (let block of blocks) {
    const blockNum = new BigNum(block.number, 10)
    await app.services.chaindb.addBlockHeader(blockNum, block.hash)
    await app.services.contract.submitBlock(block.hash)
  }
}

const hash = (transaction) => {
  return (new UnsignedTransaction(transaction)).hash.slice(2)
}

const sign = (address, transaction) => {
  const account = accounts.find((account) => {
    return account.address === address
  })
  return web3.eth.accounts.privateKeyToAccount(account.key).sign('0x' + hash(transaction)).signature
}

const autoSign = (transaction) => {
  transaction.signatures = []
  for (let transfer of transaction.transfers) {
    transaction.signatures.push(sign(transfer.sender, transaction))
  }
  return transaction
}

/* Useful constants */
const deposits = [
  { token: 0, block: 0, start: 0, end: 50, owner: accounts[0].address }
]

let transaction1 = {
  block: 1,
  transfers: [
    { token: 0, start: 0, end: 50, sender: accounts[0].address, recipient: accounts[1].address }
  ]
}
transaction1 = autoSign(transaction1)

let transaction2 = {
  block: 2,
  transfers: [
    { token: 0, start: 0, end: 50, sender: accounts[1].address, recipient: accounts[2].address }
  ]
}
transaction2 = autoSign(transaction2)

const proof = [
  {
    transaction: transaction1,
    proof: [
      {
        leafIndex: new BigNum(0),
        parsedSum: new BigNum('ffffffffffffffffffffffffffffffff', 'hex'),
        inclusionProof: [],
        signature: transaction1.signatures[0]
      }
    ]
  },
  {
    transaction: transaction2,
    proof: [
      {
        leafIndex: new BigNum(0),
        parsedSum: new BigNum('ffffffffffffffffffffffffffffffff', 'hex'),
        inclusionProof: [],
        signature: transaction2.signatures[0]
      }
    ]
  }
]

const blocks = [
  {
    number: 1,
    hash: hash(transaction1)
  },
  {
    number: 2,
    hash: hash(transaction2)
  }
]

describe('ProofService', async () => {
  const verifier = new ProofService({ app: app })

  before(async () => {
    await verifier.start()
  })

  beforeEach(async () => {
    await app.reset()
    app.services.contract = new MockContractProvider({ app: app })
    await app.services.contract.start()
    await submitDeposits(deposits)
    await submitBlocks(blocks)
  })

  after(async () => {
    await app.stop()
  })

  it('should correctly check a valid transaction proof', async () => {
    const validity = await verifier.checkProof(transaction2, deposits, proof)

    validity.should.be.true
  })

  it('should correctly check a valid transaction proof with many deposits', async () => {
    const manyDeposits = [
      {
        token: 0,
        block: 2,
        start: 50,
        end: 60,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 2,
        start: 60,
        end: 70,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 2,
        start: 70,
        end: 80,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 2,
        start: 80,
        end: 90,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 2,
        start: 90,
        end: 100,
        owner: accounts[0].address
      }
    ]

    let manyDepositTx1 = {
      block: 3,
      transfers: [
        { token: 0, start: 50, end: 100, sender: accounts[0].address, recipient: accounts[1].address }
      ]
    }
    manyDepositTx1 = autoSign(manyDepositTx1)

    let manyDepositTx2 = {
      block: 4,
      transfers: [
        { token: 0, start: 50, end: 100, sender: accounts[1].address, recipient: accounts[2].address }
      ]
    }
    manyDepositTx2 = autoSign(manyDepositTx2)

    const manyDepositProof = [
      {
        transaction: manyDepositTx1,
        proof: [
          {
            leafIndex: new BigNum(0),
            parsedSum: new BigNum('ffffffffffffffffffffffffffffffff', 'hex'),
            inclusionProof: [],
            signature: manyDepositTx1.signatures[0]
          }
        ]
      },
      {
        transaction: manyDepositTx2,
        proof: [
          {
            leafIndex: new BigNum(0),
            parsedSum: new BigNum('ffffffffffffffffffffffffffffffff', 'hex'),
            inclusionProof: [],
            signature: manyDepositTx2.signatures[0]
          }
        ]
      }
    ]

    await submitDeposits(manyDeposits)
    await submitBlocks([
      {
        number: 3,
        hash: hash(manyDepositTx1)
      },
      {
        number: 4,
        hash: hash(manyDepositTx2)
      }
    ])

    const validity = await verifier.checkProof(manyDepositTx2, manyDeposits, manyDepositProof)

    validity.should.be.true
  })

  it('should not verify an invalid set of deposits', async () => {
    const invalidDeposits = [
      { token: 0, block: 0, start: 0, end: 10, owner: accounts[0].address }
    ]

    await verifier.checkProof(transaction2, invalidDeposits, proof).should.be.rejectedWith('Invalid deposit')
  })

  it('should not verify an invalid range', async () => {
    let invalidTransaction = _.cloneDeep(transaction2)
    invalidTransaction.transfers[0].start = 50
    invalidTransaction.transfers[0].end = 0
    invalidTransaction = autoSign(invalidTransaction)

    await verifier.checkProof(invalidTransaction, deposits, proof).should.be.rejectedWith('Invalid state transition')
  })

  it('should not verify a zero-length range', async () => {
    let invalidTransaction = _.cloneDeep(transaction2)
    invalidTransaction.transfers[0].end = 0
    invalidTransaction = autoSign(invalidTransaction)

    await verifier.checkProof(invalidTransaction, deposits, proof).should.be.rejectedWith('Invalid state transition')
  })

  it('should not verify with missing chunks of history', async () => {
    let invalidProof = _.cloneDeep(proof)
    invalidProof[0].transaction.transfers[0].end = 25
    invalidProof[0].proof[0].signature = sign(invalidProof[0].transaction.transfers[0].sender, invalidProof[0].transaction)
    await app.services.chaindb.addBlockHeader(new BigNum(1), hash(invalidProof[0].transaction))

    await verifier.checkProof(transaction2, deposits, invalidProof).should.be.rejectedWith('Invalid state transition')
  })

  it('should not verify an invalid history', async () => {
    let invalidProof = _.cloneDeep(proof)
    invalidProof[0].transaction.transfers[0].sender = accounts[1].address
    invalidProof[0].proof[0].signature = sign(invalidProof[0].transaction.transfers[0].sender, invalidProof[0].transaction)
    await app.services.chaindb.addBlockHeader(new BigNum(1), hash(invalidProof[0].transaction))

    await verifier.checkProof(transaction2, deposits, invalidProof).should.be.rejectedWith('Invalid state transition')
  })

  it('should not verify a transaction with an invalid signature', async () => {
    let invalidProof = _.cloneDeep(proof)
    invalidProof[0].proof[0].signature = sign(invalidProof[0].transaction.transfers[0].recipient, invalidProof[0].transaction)

    await verifier.checkProof(transaction2, deposits, invalidProof).should.be.rejectedWith('Invalid transaction')
  })

  it('should not verify a transaction with an invalid inclusion proof', async () => {
    let invalidProof = _.cloneDeep(proof)
    invalidProof[0].proof[0].inclusionProof = [
      '0000000000000000000000000000000000000000000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]

    await verifier.checkProof(transaction2, deposits, invalidProof).should.be.rejectedWith('Invalid transaction')
  })
})
