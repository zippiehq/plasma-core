const chai = require('chai')
const BigNum = require('bn.js')

chai.should()

const models = require('../../../../../src/services/contract/events/event-models')

describe('Event Models', async () => {
  describe('DepositEvent', () => {
    it('should parse an event correctly', () => {
      const event = {
        returnValues: {
          depositer: '0x0000000000000000000000000000000000000000',
          untypedStart: '123',
          untypedEnd: '456',
          tokenType: '999',
          plasmaBlockNumber: '111'
        }
      }
      const deposit = new models.DepositEvent(event)
      const expected = {
        owner: '0x0000000000000000000000000000000000000000',
        start: new BigNum(123),
        end: new BigNum(456),
        token: new BigNum(999),
        block: new BigNum(111)
      }

      deposit.should.deep.include(expected)
    })
  })

  describe('BlockSubmittedEvent', () => {
    it('should parse an event correctly', () => {
      const event = {
        returnValues: {
          submittedHash: '0x0',
          blockNumber: '111'
        }
      }
      const block = new models.BlockSubmittedEvent(event)
      const expected = {
        hash: '0x0',
        number: 111
      }

      block.should.deep.include(expected)
    })
  })

  describe('ExitStartedEvent', () => {
    it('should parse an event correctly', () => {
      const event = {
        blockNumber: '12345',
        returnValues: {
          tokenType: '999',
          untypedStart: '123',
          untypedEnd: '456',
          exitID: '1',
          exiter: '0x0000000000000000000000000000000000000000'
        }
      }
      const exit = new models.ExitStartedEvent(event)
      const expected = {
        token: new BigNum(999),
        start: new BigNum(123),
        end: new BigNum(456),
        id: new BigNum(1),
        block: new BigNum(12345),
        exiter: '0x0000000000000000000000000000000000000000'
      }

      exit.should.deep.include(expected)
    })
  })

  describe('ExitFinalizedEvent', () => {
    it('should parse an event correctly', () => {
      const event = {
        returnValues: {
          tokenType: '999',
          untypedStart: '123',
          untypedEnd: '456',
          exitID: '1'
        }
      }
      const exit = new models.ExitFinalizedEvent(event)
      const expected = {
        token: new BigNum(999),
        start: new BigNum(123),
        end: new BigNum(456),
        id: new BigNum(1)
      }

      exit.should.deep.include(expected)
    })
  })
})
