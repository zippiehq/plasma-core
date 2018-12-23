const Web3 = require('web3')
const BaseService = require('./base-service')

const ABI = '' // TODO: Have this come from some config variable
const CONTRACT_ADDRESS = '0x0' // TODO: Have this come from some config variable

class ETHService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
    this.web3 = new Web3(options.app.config.ethProvider)
    const PlasmaContract = this.web3.eth.contract(ABI)
    this.contract = PlasmaContract.at(CONTRACT_ADDRESS)
  }

  startExit () {
    throw Error('Not implemented')
  }

  deposit (amount) {
    return new Promise((resolve, reject) => {
      this.contract.deposit({
        value: amount
      }, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }

  getBlock (number) {
    return new Promise((resolve, reject) => {
      this.contract.getBlock(number, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }
}

module.exports = ETHService
