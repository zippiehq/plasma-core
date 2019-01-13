const chai = require('chai')
const should = chai.should()

const ProofService = require('../../../src/services/proof/proof-service')
const constants = require('../../constants')
const accounts = constants.ACCOUNTS

const deposits = [
  { block: 0, start: 0, end: 50, owner: accounts[0] }
]

const proof = [
  {
    transaction: {
      block: 1,
      transfers: [
        { start: 0, end: 50, from: accounts[0], to: accounts[1] }
      ],
      signatures: []
    }
  }
]

const transaction = {
  block: 2,
  transfers: [
    { start: 0, end: 50, from: accounts[1], to: accounts[2] }
  ]
}

describe('ProofService', () => {
  const verifier = new ProofService()

  it('should correctly check a valid transaction proof', () => {
    const validity = verifier.checkProof(transaction, deposits, proof)

    validity.should.be.true
  })

  it('should correctly check a valid transaction proof with many deposits', () => {
    const manyDeposits = [
      {
        block: 0,
        start: 0,
        end: 10,
        owner: accounts[0]
      },
      {
        block: 0,
        start: 10,
        end: 20,
        owner: accounts[0]
      },
      {
        block: 0,
        start: 20,
        end: 30,
        owner: accounts[0]
      },
      {
        block: 0,
        start: 30,
        end: 40,
        owner: accounts[0]
      },
      {
        block: 0,
        start: 40,
        end: 50,
        owner: accounts[0]
      }
    ]
    const validity = verifier.checkProof(transaction, manyDeposits, proof)

    validity.should.be.true
  })

  it('should not verify an invalid set of deposits', () => {
    const invalidDeposits = [
      { block: 0, start: 0, end: 10, owner: accounts[0] }
    ]

    should.Throw(() => {
      verifier.checkProof(transaction, invalidDeposits, proof)
    }, 'Invalid state transition')
  })

  it('should not verify an invalid range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        { start: 50, end: 0, from: accounts[1], to: accounts[2] }
      ],
      signatures: []
    }

    should.Throw(() => {
      verifier.checkProof(invalidTransaction, deposits, proof)
    }, 'Invalid transaction')
  })

  it('should not verify a zero-length range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        { start: 0, end: 0, from: accounts[1], to: accounts[2] }
      ],
      signatures: []
    }

    should.Throw(() => {
      verifier.checkProof(invalidTransaction, deposits, proof)
    }, 'Invalid transaction')
  })

  it('should not verify with missing chunks of history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [
            { start: 0, end: 25, from: accounts[0], to: accounts[1] }
          ],
          signatures: []
        }
      }
    ]

    should.Throw(() => {
      verifier.checkProof(transaction, deposits, invalidProof)
    }, 'Invalid state transition')
  })

  it('should not verify an invalid history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [
            { start: 0, end: 50, from: accounts[1], to: accounts[0] }
          ],
          signatures: []
        }
      }
    ]

    should.Throw(() => {
      verifier.checkProof(transaction, deposits, invalidProof)
    }, 'Invalid state transition')
  })
})
