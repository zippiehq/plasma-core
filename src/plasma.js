const utils = require('plasma-utils')
const services = require('./services/index')
const debug = require('debug')

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
const Web3Provider = services.Web3Provider
const EventWatcherService = services.EventWatcherService

const defaultOptions = {
  logger: new utils.logging.DefaultLogger(),
  dbProvider: DefaultDBProvider,
  operatorProvider: DefaultOperatorProvider,
  walletProvider: DefaultWalletProvider,
  contractProvider: DefaultContractProvider,
  web3Provider: Web3Provider
}

/**
 * Main class that runs and manages all services.
 */
class Plasma {
  constructor (options = {}) {
    this.options = Object.assign({}, defaultOptions, options)
    this.logger = this.options.logger

    this.services = {}
    this._loggers = {}
    this._registerServices()
  }

  get loggers () {
    return new Proxy(this._loggers, {
      get: (obj, prop) => {
        if (!(prop in obj)) {
          obj[prop] = debug(prop)
        }
        return obj[prop]
      }
    })
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
      this.options.web3Provider,
      this.options.dbProvider,
      ChainService,
      RangeManagerService,
      JSONRPCService,
      this.options.operatorProvider,
      this.options.walletProvider,
      EventWatcherService,
      this.options.contractProvider,
      SyncService,
      ProofService
    ]

    for (let service of services) {
      this.registerService(service, this.options)
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
        this.loggers['core:bootstrap'](`${service.name}: STARTED`)
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
        this.loggers['core:bootstrap'](`${service.name}: STOPPED`)
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
