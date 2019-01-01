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
  getOwnedRanges (address) {
    throw new Error('Not implemented')
  }

  /**
   * Picks the best ranges for a given transaction.
   * @param {string} address An address.
   * @param {string} token Identifier of the token being sent.
   * @param {number} amount Number of tokens being sent.
   * @return {*} List of ranges to use for the transaction.
   */
  pickRanges (address, token, amount) {
    throw new Error('Not implemented')
  }

  /**
   * Adds a range for a given user.
   * @param {*} address An address.
   * @param {*} range A range to add.
   */
  addRange (address, range) {
    throw new Error('Not implemented')
  }

  /**
   * Removes a range for a given user.
   * @param {*} address An address.
   * @param {*} range A range to remove.
   */
  removeRange (address, range) {
    throw new Error('Not implemented')
  }
}

module.exports = RangeManagerService
