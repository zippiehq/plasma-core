const BaseService = require('../base-service')

class BaseContractProvider extends BaseService {
  get name () {
    return 'contract'
  }

  /**
   * Submits a deposit for a user.
   * @param {*} token Token to deposit.
   * @param {*} amount Amount to deposit.
   * @param {*} owner User to own the deposit.
   */
  async deposit (token, amount, owner) {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  /**
   * Determines whether a deposit is valid.
   * @param {*} deposit A Deposit object.
   * @return {boolean} `true` if the deposit is valid, `false` otherwise.
   */
  async depositValid (deposit) {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  /**
   * Submits a block with the given hash.
   * @param {string} hash Hash of the block.
   */
  async submitBlock (hash) {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  /**
   * Returns the hash of the block.
   * @param {Number} block Number of the block to query.
   * @return {string} Hash of the block with that number.
   */
  async getBlock (block) {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  /**
   * Returns the current block number.
   * @return {Number} Current block number.
   */
  async getCurrentBlock () {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }

  /**
   * Returns the address of the operator.
   * @return {string} Address of the operator.
   */
  async getOperator () {
    throw new Error(
      'Classes that extend BaseContractProvider must implement this method'
    )
  }
}

module.exports = BaseContractProvider
