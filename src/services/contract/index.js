const MockContractProvider = require('./mock-provider')
const ContractProvider = require('./contract-provider')

module.exports = {
  MockContractProvider,
  ContractProvider,
  DefaultContractProvider: MockContractProvider
}
