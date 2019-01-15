const util = require('util')

const Web3 = require('web3')
const BaseService = require('./base-service')

const DEFAULT_OPTIONS = {
  provider: new Web3.providers.HttpProvider(),
  contract: {
    abi: [],
    address: '0x0000000000000000000000000000000000000000'
  }
}

/**
 * Wraps interaction with Ethereum.
 */
class ETHService extends BaseService {
  constructor (options) {
    super(Object.assign({}, DEFAULT_OPTIONS, options))
  }

  get name () {
    return 'eth'
  }

  async start () {
    this.started = true

    // Initialize Web3 and create a contract instance
    this.web3 = new Web3(this.options.provider)
    this.contract = new this.web3.eth.Contract(
      this.options.contract.abi,
      this.options.contract.address
    )

    // TODO: Figure out how to handle watching for events.
  }

  /**
   * Deposits value into the plasma contract.
   * @param {*} token Token to deposit.
   * @param {*} amount Amount to deposit.
   * @return {*} A transaction receipt.
   */
  deposit (token, amount) {
    return util.promisify(
      this.contract.deposit({
        value: amount
      })
    )
  }

  /**
   * Starts an exit.
   */
  startExit () {
    throw new Error('Not implemented')
  }

  /**
   * Starts an exit challenge.
   */
  startChallenge () {
    throw new Error('Not implemented')
  }

  /**
   * Returns data for a block by its number.
   * @param {number} block Number (height) of the block to query.
   */
  getBlock (block) {
    return util.promisify(this.contract.getBlock(block))
  }
}

module.exports = ETHService
