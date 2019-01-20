const utils = require('plasma-utils')

const DefaultDBProvider = require('./services/db').DefaultDBProvider
const DefaultOperatorProvider = require('./services/operator')
  .DefaultOperatorProvider
const DefaultWalletProvider = require('./services/wallet').DefaultWalletProvider
const JSONRPCService = require('./services/jsonrpc/jsonrpc-service')
const ChainService = require('./services/chain/chain-service')
const RangeManagerService = require('./services/chain/range-manager-service')
const ETHService = require('./services/eth/eth-service')
const SyncService = require('./services/sync-service')
const ProofService = require('./services/proof/proof-service')

const defaultOptions = {
  logger: new utils.logging.DefaultLogger(),
  dbProvider: DefaultDBProvider,
  operatorProvider: DefaultOperatorProvider,
  walletProvider: DefaultWalletProvider
}

/**
 * Main class that runs and manages all services.
 */
class Plasma {
  constructor (options = {}) {
    this.options = Object.assign({}, defaultOptions, options)
    this.logger = this.options.logger

    this.services = {}
    this._registerServices()
  }

  /**
   * Registers a single service to the app.
   * @param {*} Service Class of the service to register.
   * @param {*} options Any additional options.
   */
  registerService (Service, options = {}) {
    const appInject = { app: this }
    const service = new Service({ ...options, ...appInject })
    this.services[service.name] = service
  }

  /**
   * Registers all services.
   */
  _registerServices () {
    const services = [
      { type: this.options.dbProvider },
      { type: ChainService },
      { type: RangeManagerService },
      { type: JSONRPCService },
      { type: this.options.operatorProvider },
      { type: this.options.walletProvider },
      { type: ETHService },
      { type: SyncService },
      { type: ProofService }
    ]

    for (let service of services) {
      this.registerService(service.type, service.options)
    }
  }

  /**
   * Starts a single service.
   * @param {*} name Name of the service to start.
   */
  async startService (name) {
    let service = this.services[name]
    service
      .start()
      .then(() => {
        this.logger.log(`${service.name}: OK`)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  /**
   * Stops a single service.
   * @param {*} name Name of the service to stop.
   */
  async stopService (name) {
    let service = this.services[name]
    service
      .stop()
      .then(() => {
        this.logger.log(`${service.name}: OK`)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  /**
   * Starts all available services.
   */
  async startServices () {
    for (let service in this.services) {
      await this.startService(service)
    }
  }

  /**
   * Stops all available services.
   */
  async stopServices () {
    for (let service in this.services) {
      await this.stopService(service)
    }
  }
}

module.exports = Plasma
