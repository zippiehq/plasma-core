const assert = require('chai').assert
const ProofService = require('../../../src/services/proof/proof-service')

const accounts = [
  '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  '0x838e93821250388d0fa7ea74c4f89872e705e31a'
]

const deposits = [
  {
    block: 0,
    start: 0,
    end: 50,
    owner: accounts[0]
  }
]

const proof = [
  {
    transaction: {
      block: 1,
      transfers: [{
        start: 0,
        end: 50,
        from: accounts[0],
        to: accounts[1]
      }],
      signatures: []
    }
  }
]

const transaction = {
  block: 2,
  transfers: [
    {
      start: 0,
      end: 50,
      from: accounts[1],
      to: accounts[2]
    }
  ]
}

describe('ProofService', () => {
  const verifier = new ProofService()
  it('should correctly check a valid transaction proof', () => {
    const proofValid = verifier.checkProof(transaction, deposits, proof)
    assert.isTrue(proofValid, 'proof was correctly verified')
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
    const proofValid = verifier.checkProof(transaction, manyDeposits, proof)
    assert.isTrue(proofValid, 'proof was correctly verified')
  })
  it('should not verify an invalid set of deposits', () => {
    const invalidDeposits = [{
      block: 0,
      start: 0,
      end: 10, // Deposits don't fully cover the ranges being transferred.
      owner: accounts[0]
    }]
    assert.throws(() => {
      verifier.checkProof(transaction, invalidDeposits, proof)
    }, 'Invalid state transition', 'proof was correctly rejected')
  })
  it('should not verify an invalid range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        {
          start: 50, // Start comes before end.
          end: 0,
          from: accounts[1],
          to: accounts[2]
        }
      ],
      signatures: []
    }
    assert.throws(() => {
      verifier.checkProof(invalidTransaction, deposits, proof)
    }, 'Invalid transaction', 'proof was correctly rejected')
  })
  it('should not verify a zero-length range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        {
          start: 0,
          end: 0, // End is the same as the start.
          from: accounts[1],
          to: accounts[2]
        }
      ],
      signatures: []
    }
    assert.throws(() => {
      verifier.checkProof(invalidTransaction, deposits, proof)
    }, 'Invalid transaction', 'proof was correctly rejected')
  })
  it('should not verify with missing chunks of history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [{
            start: 0,
            end: 25, // Doesn't cover the full range.
            from: accounts[0],
            to: accounts[1]
          }],
          signatures: []
        }
      }
    ]
    assert.throws(() => {
      verifier.checkProof(transaction, deposits, invalidProof)
    }, 'Invalid state transition', 'proof was correctly rejected')
  })
  it('should not verify an invalid history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [{
            start: 0,
            end: 50,
            from: accounts[1], // Wrong sender.
            to: accounts[0]
          }],
          signatures: []
        }
      }
    ]
    assert.throws(() => {
      verifier.checkProof(transaction, deposits, invalidProof)
    }, 'Invalid state transition', 'proof was correctly rejected')
  })
})
