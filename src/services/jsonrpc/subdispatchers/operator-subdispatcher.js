const BaseSubdispatcher = require('./base-subdispatcher')

/**
 * Subdispatcher that handles Operator-related requests.
 */
class OperatorSubdispatcher extends BaseSubdispatcher {
  get prefix () {
    return 'pg_'
  }

  get dependencies () {
    return ['operator']
  }

  get methods () {
    const operator = this.app.services.operator
    return {
      submitBlock: operator.submitBlock.bind(operator),
      getEthInfo: operator.getEthInfo.bind(operator),
      getNextBlock: operator.getNextBlock.bind(operator)
    }
  }
}

module.exports = OperatorSubdispatcher
