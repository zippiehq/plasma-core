const BaseContractProvider = require('./base-provider')
const _ = require('lodash')

class MockContractProvider extends BaseContractProvider {
  constructor () {
    super()

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
    // Initialize if this token hasn't been deposited before.
    if (!(token in this.lastRanges)) {
      this.lastRanges[token] = 0
    }

    const end = this.lastRanges[token] + amount
    const deposit = {
      token: token,
      start: this.lastRanges[token],
      end: end,
      owner: owner,
      block: await this.getCurrentBlock()
    }
    this.deposits.push(deposit)

    this.emitContractEvent('Deposit', deposit)

    this.lastRanges[token] = end
  }

  async depositValid (deposit) {
    return this.deposits.some((d) => {
      return _.isEqual(d, deposit)
    })
  }

  async submitBlock (hash) {
    this.blocks[this.nextBlock] = hash

    this.emitContractEvent('BlockSubmitted', {
      number: this.nextBlock,
      hash: hash
    })

    this.nextBlock++
  }

  async getBlock (number) {
    return this.blocks[number]
  }

  async getCurrentBlock () {
    return this.nextBlock - 1
  }
}

module.exports = MockContractProvider
