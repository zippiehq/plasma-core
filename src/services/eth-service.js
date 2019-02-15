const BigNum = require('bn.js')
const BaseService = require('./base-service')

class ETHService extends BaseService {
  get name () {
    return 'eth'
  }

  get dependencies () {
    return ['web3']
  }

  /**
   * Returns the current ETH balance of an address.
   * Queries the main chain, *not* the plasma chain.
   * @param {string} address Address to query.
   * @return {BigNum} The account's ETH balance.
   */
  async getBalance (address) {
    const balance = await this.services.web3.eth.getBalance(address)
    return new BigNum(balance, 10)
  }

  /**
   * Returns the current ETH block.
   * @return {number} The current ETH block.
   */
  async getCurrentBlock () {
    return this.services.web3.eth.getBlockNumber()
  }
}

module.exports = ETHService
