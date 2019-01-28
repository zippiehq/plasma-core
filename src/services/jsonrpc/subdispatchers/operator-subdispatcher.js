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
}

module.exports = OperatorSubdispatcher
