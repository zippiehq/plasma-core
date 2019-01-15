const chai = require('chai')
chai.should()

const ProofService = require('../../../src/services/proof/proof-service')

const app = require('../../mock-app')
const constants = require('../../constants')
const accounts = constants.ACCOUNTS

const deposits = [
  { token: 0, block: 0, start: 0, end: 50, owner: accounts[0] }
]

const proof = [
  {
    transaction: {
      block: 1,
      transfers: [
        { token: 0, start: 0, end: 50, from: accounts[0], to: accounts[1] }
      ],
      signatures: []
    }
  }
]

const transaction = {
  block: 2,
  transfers: [
    { token: 0, start: 0, end: 50, from: accounts[1], to: accounts[2] }
  ]
}

const submitDeposits = async (deposits) => {
  for (let deposit of deposits) {
    await app.services.eth.contract.deposit(0, deposit.end - deposit.start, deposit.owner)
  }
}

describe('ProofService', async () => {
  await submitDeposits(deposits)
  const verifier = new ProofService({ app: app })
  await verifier.start()

  it('should correctly check a valid transaction proof', async () => {
    const validity = await verifier.checkProof(transaction, deposits, proof)

    validity.should.be.true
  })

  it('should correctly check a valid transaction proof with many deposits', async () => {
    const manyDeposits = [
      {
        token: 0,
        block: 0,
        start: 50,
        end: 60,
        owner: accounts[0]
      },
      {
        token: 0,
        block: 0,
        start: 60,
        end: 70,
        owner: accounts[0]
      },
      {
        token: 0,
        block: 0,
        start: 70,
        end: 80,
        owner: accounts[0]
      },
      {
        token: 0,
        block: 0,
        start: 80,
        end: 90,
        owner: accounts[0]
      },
      {
        token: 0,
        block: 0,
        start: 90,
        end: 100,
        owner: accounts[0]
      }
    ]
    const manyDepositProof = [
      {
        transaction: {
          block: 1,
          transfers: [
            { token: 0, start: 50, end: 100, from: accounts[0], to: accounts[1] }
          ],
          signatures: []
        }
      }
    ]
    const manyDepositTx = {
      block: 2,
      transfers: [
        { token: 0, start: 50, end: 100, from: accounts[1], to: accounts[2] }
      ]
    }

    await submitDeposits(manyDeposits)
    const validity = await verifier.checkProof(manyDepositTx, manyDeposits, manyDepositProof)

    validity.should.be.true
  })

  it('should not verify an invalid set of deposits', async () => {
    const invalidDeposits = [
      { token: 0, block: 0, start: 0, end: 10, owner: accounts[0] }
    ]

    await verifier.checkProof(transaction, invalidDeposits, proof).should.be.rejectedWith('Invalid deposit')
  })

  it('should not verify an invalid range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        { token: 0, start: 50, end: 0, from: accounts[1], to: accounts[2] }
      ],
      signatures: []
    }

    verifier.checkProof(invalidTransaction, deposits, proof).should.be.rejectedWith('Invalid transaction')
  })

  it('should not verify a zero-length range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        { token: 0, start: 0, end: 0, from: accounts[1], to: accounts[2] }
      ],
      signatures: []
    }

    verifier.checkProof(invalidTransaction, deposits, proof).should.be.rejectedWith('Invalid transaction')
  })

  it('should not verify with missing chunks of history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [
            { token: 0, start: 0, end: 25, from: accounts[0], to: accounts[1] }
          ],
          signatures: []
        }
      }
    ]

    verifier.checkProof(transaction, deposits, invalidProof).should.be.rejectedWith('Invalid state transition')
  })

  it('should not verify an invalid history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [
            { token: 0, start: 0, end: 50, from: accounts[1], to: accounts[0] }
          ],
          signatures: []
        }
      }
    ]

    verifier.checkProof(transaction, deposits, invalidProof).should.be.rejectedWith('Invalid state transition')
  })
})
