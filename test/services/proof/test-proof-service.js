const chai = require('chai')
const BigNum = require('bn.js')

chai.should()

const ProofService = require('../../../src/services/proof/proof-service')

const app = require('../../mock-app')
const constants = require('../../constants')
const accounts = constants.ACCOUNTS

const deposits = [
  { token: 0, block: 0, start: 0, end: 50, owner: accounts[0].address }
]

const proof = [
  {
    transaction: {
      block: 1,
      transfers: [
        { token: 0, start: 0, end: 50, sender: accounts[0].address, recipient: accounts[1].address }
      ]
    },
    proof: [
      {
        leafIndex: new BigNum(0),
        parsedSum: new BigNum('ffffffffffffffffffffffffffffffff'),
        inclusionProof: [
          '0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffff'
        ],
        signature: {
          v: '1c',
          r: '02183cd7e1d8e3ff24d3eac4960b377abe96a35e41767b0dcac7b96346ac0e26',
          s: '4f2734a6b2d70844dde0959b386f0c47f414ceef0ca6b57406d72a2e69e01959'
        }
      }
    ]
  }
]

const blocks = [
  '0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffff',
  '652bd4ecfdb5162357089395a3f23ef42144d2907c5110f8c6ff909c4bb17d1cffffffffffffffffffffffffffffffff'
]

const transaction = {
  block: 2,
  transfers: [
    { token: 0, start: 0, end: 50, sender: accounts[1].address, recipient: accounts[2].address }
  ]
}

const submitDeposits = async (deposits) => {
  for (let deposit of deposits) {
    await app.services.eth.contract.deposit(0, deposit.end - deposit.start, deposit.owner)
  }
}

const submitBlocks = async (blocks) => {
  for (let block of blocks) {
    await app.services.eth.contract.submitBlock(block)
  }
}

describe('ProofService', async () => {
  const verifier = new ProofService({ app: app })

  before(async () => {
    await verifier.start()
  })

  beforeEach(async () => {
    app.reset()
    await submitDeposits(deposits)
    await submitBlocks(blocks)
  })

  it('should correctly check a valid transaction proof', async () => {
    const validity = await verifier.checkProof(transaction, deposits, proof)

    validity.should.be.true
  })

  it('should correctly check a valid transaction proof with many deposits', async () => {
    const manyDeposits = [
      {
        token: 0,
        block: 1,
        start: 50,
        end: 60,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 1,
        start: 60,
        end: 70,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 1,
        start: 70,
        end: 80,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 1,
        start: 80,
        end: 90,
        owner: accounts[0].address
      },
      {
        token: 0,
        block: 1,
        start: 90,
        end: 100,
        owner: accounts[0].address
      }
    ]
    const manyDepositProof = [
      {
        transaction: {
          block: 2,
          transfers: [
            { token: 0, start: 50, end: 100, sender: accounts[0].address, recipient: accounts[1].address }
          ]
        },
        proof: [
          {
            leafIndex: new BigNum(0),
            parsedSum: 'ffffffffffffffffffffffffffffffff',
            inclusionProof: [
              '0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffff'
            ],
            signature: {
              v: '1b',
              r: '2ce7b4dbfee647f99b1e2454d61fe323261253bd0bab36e38876e37ffe7a8470',
              s: '16023f2cf78553ef6f20ec93557eb9f2f9a5b51423d3eae322419242e01b5a03'
            }
          }
        ]
      }
    ]
    const manyDepositTx = {
      block: 3,
      transfers: [
        { token: 0, start: 50, end: 100, sender: accounts[1].address, recipient: accounts[2].address }
      ]
    }

    await submitDeposits(manyDeposits)
    await submitBlocks(['b4c4b4d13ff92bb050e7f3b9816a5738424b2413178661d0c42348dc90db870dffffffffffffffffffffffffffffffff'])

    const validity = await verifier.checkProof(manyDepositTx, manyDeposits, manyDepositProof)

    validity.should.be.true
  })

  it('should not verify an invalid set of deposits', async () => {
    const invalidDeposits = [
      { token: 0, block: 0, start: 0, end: 10, owner: accounts[0].address }
    ]

    await verifier.checkProof(transaction, invalidDeposits, proof).should.be.rejectedWith('Invalid deposit')
  })

  it('should not verify an invalid range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        { token: 0, start: 50, end: 0, sender: accounts[1].address, recipient: accounts[2].address }
      ]
    }

    verifier.checkProof(invalidTransaction, deposits, proof).should.be.rejectedWith('Invalid transaction')
  })

  it('should not verify a zero-length range', () => {
    const invalidTransaction = {
      block: 2,
      transfers: [
        { token: 0, start: 0, end: 0, sender: accounts[1].address, recipient: accounts[2].address }
      ]
    }

    verifier.checkProof(invalidTransaction, deposits, proof).should.be.rejectedWith('Invalid transaction')
  })

  it('should not verify with missing chunks of history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [
            { token: 0, start: 0, end: 25, sender: accounts[0].address, recipient: accounts[1].address }
          ]
        },
        proof: [
          {
            leafIndex: new BigNum(0),
            parsedSum: new BigNum('ffffffffffffffffffffffffffffffff'),
            inclusionProof: [
              '0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffff'
            ],
            signature: {
              v: '1c',
              r: 'f5a40ed275abebfa762285be122600fa5988c4e07911b6d93944f9772b86c7ce',
              s: '517fc1f9fe01d76bee4fa940f75ab97937897b611db77fd317166b3ee029b2d8'
            }
          }
        ]
      }
    ]
    app.services.eth.contract.blocks[1] = 'f3b046095f1677c11ea526702c4e5601a5832d8fa4b664313ab8aff889e6572cffffffffffffffffffffffffffffffff'

    verifier.checkProof(transaction, deposits, invalidProof).should.be.rejectedWith('Invalid state transition')
  })

  it('should not verify an invalid history', () => {
    const invalidProof = [
      {
        transaction: {
          block: 1,
          transfers: [
            { token: 0, start: 0, end: 50, sender: accounts[1].address, recipient: accounts[0].address }
          ]
        },
        proof: [
          {
            leafIndex: new BigNum(0),
            parsedSum: new BigNum('ffffffffffffffffffffffffffffffff'),
            inclusionProof: [
              '0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffff'
            ],
            signature: {
              v: '1c',
              r: '1b54e1576c5e361178202729e95bcfba676adaf78e20c70a9ace45f0208d18c7',
              s: '413d7a8ec51b9bbf295efa366ba96aa7d508c226b44d299ba872dd65408d593c'
            }
          }
        ]
      }
    ]
    app.services.eth.contract.blocks[1] = 'e8564e8cdf308d1e64065634e5464f7722dd7cb0b20c8d5629a2fbc782b67c58ffffffffffffffffffffffffffffffff'

    verifier.checkProof(transaction, deposits, invalidProof).should.be.rejectedWith('Invalid state transition')
  })
})
