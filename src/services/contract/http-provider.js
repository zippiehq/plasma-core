const BaseContractProvider = require('./base-provider')
const plasmaChainCompiled = require('plasma-contracts').plasmaChainCompiled

class HttpContractProvider extends BaseContractProvider {
  async start () {
    this.started = true
    this.contract = new this.services.web3.eth.Contract(plasmaChainCompiled.abi)
  }

  async getBlock (block) {
    return this.contract.methods.blockHashes(block).call()
  }
}

module.exports = HttpContractProvider
