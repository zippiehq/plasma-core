const MockContractProvider = require('./mock-provider')
const HttpContractProvider = require('./http-provider')

module.exports = {
  MockContractProvider,
  HttpContractProvider,
  DefaultContractProvider: MockContractProvider
}
