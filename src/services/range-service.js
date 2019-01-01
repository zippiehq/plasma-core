const BaseService = require('./base-service')

class RangeManagerService extends BaseService {
  get name () {
    return 'range'
  }

  /**
   * Returns the list of ranges owned by an address.
   * @param {string} address An address.
   * @return {*} List of owned ranges.
   */
  async getOwnedRanges (address) {
    throw new Error('Not implemented')
  }

  /**
   * Determines if an address owns a specific range.
   * @param {string} address An address.
   * @param {*} range A range object.
   * @return {boolean} `true` if the user owns the range, `false` otherwise.
   */
  async ownsRange (address, range) {
    throw new Error('Not implemented')
  }

  /**
   * Picks the best ranges for a given transaction.
   * @param {string} address An address.
   * @param {string} token Identifier of the token being sent.
   * @param {number} amount Number of tokens being sent.
   * @return {*} List of ranges to use for the transaction.
   */
  async pickRanges (address, token, amount) {
    throw new Error('Not implemented')
  }

  /**
   * Determines of an account can spend an amount of a token.
   * @param {*} address An address
   * @param {*} token Identifier of the token being sent.
   * @param {*} amount Number of tokens being sent.
   * @return {boolean} `true` if the user can spend the tokens, `false` otherwise.
   */
  async canSpend (address, token, amount) {
    try {
      await this.pickRanges(address, token, amount)
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Adds a range for a given user.
   * @param {*} address An address.
   * @param {*} range A range to add.
   */
  async addRange (address, range) {
    throw new Error('Not implemented')
  }

  /**
   * Removes a range for a given user.
   * @param {*} address An address.
   * @param {*} range A range to remove.
   */
  async removeRange (address, range) {
    throw new Error('Not implemented')
  }
}

module.exports = RangeManagerService
