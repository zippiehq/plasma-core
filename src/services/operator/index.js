const MockOperatorProvider = require('./mock-provider')
const HttpOperatorProvider = require('./http-provider')

module.exports = {
  MockOperatorProvider,
  HttpOperatorProvider,
  DefaultOperatorProvider: MockOperatorProvider
}
