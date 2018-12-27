const util = require('util')

const Web3 = require('web3')
const BaseService = require('./base-service')

/**
 * Wraps interaction with Ethereum.
 */
class ETHService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  get name () {
    return 'eth-service'
  }

  async start () {
    // Initialize Web3 and create a contract instance
    const config = this.app.config
    this.web3 = new Web3(config.ethProvider)
    const PlasmaContract = this.web3.eth.contract(config.contract.abi)
    this.contract = PlasmaContract.at(config.contract.address)

    // Start watching for events
    this.watchEvents()
  }

  /**
   * Watches for and relays Ethereum events.
   */
  watchEvents () {
    // TODO: Figure out how robust this is.
    this.contract.allEvents().watch((error, event) => {
      if (error) {
        console.log(error)
      } else {
        this.emit(`event:${event.event}`, event)
      }
    })
  }

  /**
   * Deposits value into the plasma contract.
   * @param {*} amount Amount to deposit.
   */
  deposit (amount) {
    return util.promisify(this.contract.deposit({
      value: amount
    }))
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
