const PlasmaCore = require('../src/plasma')
const services = require('../src/services/index')
const EphemDBProvider = services.DBProviders.EphemDBProvider
const MockContractProvider = services.ContractProviders.MockContractProvider
const MockWalletProvider = services.WalletProviders.MockWalletProvider

const options = {
  dbProvider: EphemDBProvider,
  contractProvider: MockContractProvider,
  walletProvider: MockWalletProvider,
  logger: {
    log: () => { return true }
  }
}

let core = new PlasmaCore(options)
core.reset = async function () {
  await this.stop()
  this.services = {}
  this._registerServices()
  await this.start()
}

module.exports = core
