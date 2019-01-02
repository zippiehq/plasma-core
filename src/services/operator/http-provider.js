const BaseOperatorProvider = require('./base-provider')

/**
 * Service that wraps the interface to the operator.
 */
class HttpOperatorProvider extends BaseOperatorProvider {
  get name () {
    return 'http-operator'
  }
}

module.exports = HttpOperatorProvider
