const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles Ethereum-related requests.
 */
class ETHSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  get dependencies () {
    return ['contract', 'eth']
  }

  get methods () {
    const contract = this.app.services.contract
    const eth = this.app.services.eth
    return {
      listToken: contract.listToken.bind(contract),
      getTokenId: contract.getTokenId.bind(contract),
      deposit: contract.deposit.bind(contract),
      getCurrentBlock: contract.getCurrentBlock.bind(contract),
      getEthBalance: eth.getBalance.bind(eth),
      getCurrentEthBlock: eth.getCurrentBlock.bind(eth)
    }
  }
}

module.exports = ETHSubdispatcher
