const BaseOperatorProvider = require('./base-provider')

class HttpOperatorProvider extends BaseOperatorProvider {
  get name () {
    return 'http-operator'
  }
}

module.exports = HttpOperatorProvider
