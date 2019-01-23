const utils = require('plasma-utils')
const services = require('./services/index')

const DefaultDBProvider = services.DBProviders.DefaultDBProvider
const DefaultOperatorProvider =
  services.OperatorProviders.DefaultOperatorProvider
const DefaultWalletProvider = services.WalletProviders.DefaultWalletProvider
const DefaultContractProvider =
  services.ContractProviders.DefaultContractProvider
const JSONRPCService = services.JSONRPCService
const ChainService = services.ChainService
const RangeManagerService = services.RangeManagerService
const SyncService = services.SyncService
const ProofService = services.ProofService

const defaultOptions = {
  logger: new utils.logging.DefaultLogger(),
  dbProvider: DefaultDBProvider,
  operatorProvider: DefaultOperatorProvider,
  walletProvider: DefaultWalletProvider,
  contractProvider: DefaultContractProvider
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
    let service = Service

    // Check if it's a class or an instance of the class.
    if (typeof Service === 'function') {
      const appInject = { app: this }
      service = new Service({ ...options, ...appInject })
    } else {
      service.app = this
    }

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
      { type: this.options.contractProvider },
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
  async start () {
    for (let service in this.services) {
      await this.startService(service)
    }
  }

  /**
   * Stops all available services.
   */
  async stop () {
    for (let service in this.services) {
      await this.stopService(service)
    }
  }
}

module.exports = Plasma
