const BaseService = require('./base-service')

/**
 * Wraps functionality to pull data from the operator.
 */
class OperatorService extends BaseService {
  constructor (options) {
    super()
  }

  get name () {
    return 'plasma-service'
  }

  /**
   * Queries the operator for a specific transaction.
   * @param {*} range A coin range identifier.
   * @param {*} block Block in which this transaction should be included.
   * @returns {*} A transaction, or null, along with an inclusion proof.
   */
  getTransaction (range, block) {
    // TODO: Should return null+proof or a transaction+proof
    throw new Error('Not implemented')
  }
}

module.exports = OperatorService
