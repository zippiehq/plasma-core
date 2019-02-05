const BigNum = require('bn.js')
const BaseContractProvider = require('./base-provider')

class MockContractProvider extends BaseContractProvider {
  constructor (options) {
    super(options)

    this.lastRanges = {}
    this.nextBlock = 1
    this.blocks = {}
    this.deposits = []
  }

  async stop () {
    this.started = false
    this.removeAllListeners()
  }

  async deposit (token, amount, owner) {
    token = new BigNum(token, 'hex')
    amount = new BigNum(amount, 'hex')

    // Initialize if this token hasn't been deposited before.
    if (!(token in this.lastRanges)) {
      this.lastRanges[token] = new BigNum(0)
    }

    const end = this.lastRanges[token].add(amount)
    const deposit = {
      token: token,
      start: this.lastRanges[token],
      end: end,
      owner: owner,
      block: await this.getCurrentBlock()
    }
    this.deposits.push(deposit)

    this.emitContractEvent('Deposit', [deposit])

    this.lastRanges[token] = end
  }

  async depositValid (deposit) {
    return this.deposits.some((d) => {
      return this._depositsEqual(deposit, d)
    })
  }

  async submitBlock (hash) {
    this.blocks[this.nextBlock] = hash

    this.emitContractEvent('BlockSubmitted', [
      {
        number: this.nextBlock,
        hash: hash
      }
    ])

    this.nextBlock++
  }

  async getBlock (number) {
    return this.blocks[number]
  }

  async getNextBlock () {
    return this.nextBlock
  }

  async getCurrentBlock () {
    return this.nextBlock - 1
  }

  _castDeposit (deposit) {
    return {
      token: new BigNum(deposit.token, 'hex'),
      start: new BigNum(deposit.start, 'hex'),
      end: new BigNum(deposit.end, 'hex'),
      owner: deposit.owner,
      block: deposit.block
    }
  }

  _depositsEqual (a, b) {
    a = this._castDeposit(a)
    b = this._castDeposit(b)
    return (
      a.token.eq(b.token) &&
      a.start.eq(b.start) &&
      a.end.eq(b.end) &&
      a.owner === b.owner &&
      a.block === b.block
    )
  }

  emitContractEvent (name, event) {
    this.services.eventHandler._emitContractEvent(name, event)
  }
}

module.exports = MockContractProvider
