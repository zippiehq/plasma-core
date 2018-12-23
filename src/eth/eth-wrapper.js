const Web3 = require('web3')
const abi = require('./abi.json')

const CONTRACT_ADDRESS = '0x0' // TODO: Have this come from some config variable

class EthWrapper {
  constructor (provider) {
    this.web3 = new Web3(provider)
    const PlasmaContract = this.web3.eth.contract(abi)
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

module.exports = EthWrapper
