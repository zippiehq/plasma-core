const assert = require('chai').assert
const ProofService = require('../../src/services/proof-service')

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
        from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
        to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
        start: 0,
        end: 1
      },
      proof: ''
    },
    {
      tx: {
        from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
        to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
        start: 2,
        end: 50
      },
      proof: ''
    }
  ]
}

const transaction = {
  block: 1,
  from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
  to: '0xc01b09B41355ae468174Bfb5F41a6b79825A308f',
  range: {
    token: 'OMG',
    start: 0,
    end: 50
  }
}

describe('ProofService', () => {
  const verifier = new ProofService()
  it('should correctly check a valid transaction proof', () => {
    const proofValid = verifier.checkProof(transaction, deposits, history)
    assert.isTrue(proofValid, 'proof was correctly verified')
  })
  it('should correctly check a valid transaction proof with many deposits', () => {
    const manyDeposits = [
      {
        block: 0,
        start: 0,
        end: 10
      },
      {
        block: 0,
        start: 10,
        end: 20
      },
      {
        block: 0,
        start: 20,
        end: 30
      },
      {
        block: 0,
        start: 30,
        end: 40
      },
      {
        block: 0,
        start: 40,
        end: 50
      }
    ]
    const proofValid = verifier.checkProof(transaction, manyDeposits, history)
    assert.isTrue(proofValid, 'proof was correctly verified')
  })
  it('should not verify an invalid set of deposits', () => {
    const invalidDeposits = [{
      block: 0,
      start: 0,
      end: 10
    }]
    assert.throws(() => {
      verifier.checkProof(transaction, invalidDeposits, history)
    }, 'Invalid deposit history')
  })
  it('should not verify an invalid range', () => {
    const invalidTransaction = {
      block: 1,
      from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
      to: '0xc01b09B41355ae468174Bfb5F41a6b79825A308f',
      range: {
        token: 'OMG',
        start: 50,
        end: 0
      }
    }
    assert.throws(() => {
      verifier.checkProof(invalidTransaction, deposits, history)
    }, 'Invalid range')
  })
  it('should not verify a zero-length range', () => {
    const invalidTransaction = {
      block: 1,
      from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
      to: '0xc01b09B41355ae468174Bfb5F41a6b79825A308f',
      range: {
        token: 'OMG',
        start: 0,
        end: 0
      }
    }
    assert.throws(() => {
      verifier.checkProof(invalidTransaction, deposits, history)
    }, 'Invalid range')
  })
  it('should not verify with missing chunks of history', () => {
    const invalidHistory = {
      0: [
        {
          tx: {
            from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            start: 0,
            end: 1
          },
          proof: ''
        }
      ]
    }
    assert.throws(() => {
      verifier.checkProof(transaction, deposits, invalidHistory)
    }, 'Missing history')
  })
  it('should not verify an invalid history', () => {
    const invalidHistory = {
      0: [
        {
          tx: {
            from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            start: 0,
            end: 25
          },
          proof: ''
        }
      ]
    }
    assert.throws(() => {
      verifier.checkProof(transaction, deposits, invalidHistory)
    }, 'Invalid history')
  })
  it('should not verify an invalid inclusion proof', () => {
    const invalidHistory = {
      0: [
        {
          tx: {
            from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            start: 0,
            end: 1
          },
          proof: ''
        },
        {
          tx: {
            from: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            start: 2,
            end: 50
          },
          proof: ''
        }
      ]
    }
    assert.throws(() => {
      verifier.checkProof(transaction, deposits, invalidHistory)
    }, 'Invalid history proof')
  })
  it('should not verify an invalid set of senders and receviers', () => {
    const invalidHistory = {
      0: [
        {
          tx: {
            from: '0x0000000000000000000000000000000000000000',
            to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            start: 0,
            end: 1
          },
          proof: ''
        },
        {
          tx: {
            from: '0x0000000000000000000000000000000000000000',
            to: '0xf5b42E958915BB00BfeDEc856A5f98FC22dE5d40',
            start: 2,
            end: 50
          },
          proof: ''
        }
      ]
    }
    assert.throws(() => {
      verifier.checkProof(transaction, deposits, invalidHistory)
    }, 'Invalid history')
  })
})
