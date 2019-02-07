const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles Ethereum-related requests.
 */
class ETHSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  get dependencies () {
    return ['contract']
  }

  get methods () {
    const contract = this.app.services.contract
    return {
      listToken: contract.listToken.bind(contract),
      getTokenId: contract.getTokenId.bind(contract),
      deposit: contract.deposit.bind(contract),
      getCurrentBlock: contract.getCurrentBlock.bind(contract)
    }
  }
}

module.exports = ETHSubdispatcher
