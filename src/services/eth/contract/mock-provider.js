const BaseContractProvider = require('./base-provider')
const _ = require('lodash')

class MockContractProvider extends BaseContractProvider {
  constructor () {
    super()

    this.lastRange = 0
    this.nextBlock = 1
    this.blocks = {}
    this.deposits = []
  }

  async stop () {
    this.started = false
    this.removeAllListeners()
  }

  async deposit (token, amount, owner) {
    const deposit = {
      token: token,
      start: this.lastRange,
      end: this.lastRange + amount,
      owner: owner,
      block: await this.getCurrentBlock()
    }
    this.deposits.push(deposit)

    this._emitEvent('Deposit', deposit)

    this.lastRange += amount
  }

  async depositValid (deposit) {
    return this.deposits.some((d) => {
      return _.isEqual(d, deposit)
    })
  }

  async submitBlock (hash) {
    this.blocks[this.nextBlock] = hash

    this._emitEvent('BlockSubmitted', {
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

  _emitEvent (name, event) {
    this.emit(`event:${name}`, event)
  }
}

module.exports = MockContractProvider
