const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles Operator-related requests.
 */
class OperatorSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  async submitBlock () {
    return this.app.services.operator.submitBlock()
  }

  async getEthInfo () {
    return this.app.services.operator.getEthInfo()
  }

  async getNextBlock () {
    return this.app.services.operator.getNextBlock()
  }
}

module.exports = OperatorSubdispatcher
