const ganache = require('ganache-cli')
const PlasmaCore = require('../src/plasma')
const services = require('../src/services/index')
const EphemDBProvider = services.DBProviders.EphemDBProvider
const MockContractProvider = services.ContractProviders.MockContractProvider
const MockWalletProvider = services.WalletProviders.MockWalletProvider

const stopServer = async (server) => {
  return new Promise((resolve) => {
    server.close(resolve)
  })
}

const startServer = async (server, port) => {
  return new Promise((resolve) => {
    server.listen(port, resolve)
  })
}

const options = {
  dbProvider: EphemDBProvider,
  contractProvider: MockContractProvider,
  walletProvider: MockWalletProvider,
  logger: {
    log: () => { return true }
  },
  finalityDepth: 0,
  eventPollInterval: 100,
  transactionPollInterval: 100
}

let core = new PlasmaCore(options)
core.reset = async function () {
  await this.stop()
  this.services = {}
  this._registerServices()
  await this.start()
}
core.stopEth = async function () {
  if (this.server) {
    await stopServer(this.server)
  }
}
core.startEth = async function () {
  if (this.server) {
    await this.stopEth()
  }
  this.server = ganache.server({
    gasLimit: '0x7A1200'
  })
  await startServer(this.server, '8545')
}

module.exports = core
