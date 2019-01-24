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

  async getCurrentBlock () {
    const nextBlockNumber = await this.contract.methods
      .nextPlasmaBlockNumber()
      .call()
    return nextBlockNumber - 1
  }
}

module.exports = HttpContractProvider
