const util = require('util')

const Web3 = require('web3')
const BaseService = require('./base-service')

const ABI = '' // TODO: Have this come from some config variable
const CONTRACT_ADDRESS = '0x0' // TODO: Have this come from some config variable

class ETHService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app

    // Initialize Web3 and create a contract instance
    this.web3 = new Web3(options.app.config.ethProvider)
    const PlasmaContract = this.web3.eth.contract(ABI)
    this.contract = PlasmaContract.at(CONTRACT_ADDRESS)

    // Start watching for events
    this.watchEvents()
  }

  get name () {
    return 'eth-service'
  }

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

  deposit (amount) {
    return util.promisify(this.contract.deposit({
      value: amount
    }))
  }

  startExit () {
    throw new Error('Not implemented')
  }

  startChallenge () {
    throw new Error('Not implemented')
  }

  getBlock (number) {
    return util.promisify(this.contract.getBlock(number))
  }
}

module.exports = ETHService
