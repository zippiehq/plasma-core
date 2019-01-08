const utils = require('plasma-utils')

const DefaultDBProvider = require('./services/db').DefaultDBProvider
const DefaultOperatorProvider = require('./services/operator')
  .DefaultOperatorProvider
const DefaultWalletProvider = require('./services/wallet').DefaultWalletProvider
const JSONRPCService = require('./services/jsonrpc-service')
const ChainService = require('./services/chain-service')
const RangeManagerService = require('./services/range-manager-service')

/**
 * Main class that runs and manages all services.
 */
class Plasma {
  constructor (options) {
    this.options = options
    this.services = {}
    this.logger = new utils.logging.DefaultLogger()

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
      { type: this.options.dbProvider || DefaultDBProvider },
      { type: ChainService },
      { type: JSONRPCService },
      { type: this.options.operatorProvider || DefaultOperatorProvider },
      { type: this.options.walletProvider || DefaultWalletProvider },
      { type: RangeManagerService }
    ]

    for (let service of services) {
      this.registerService(service.type, service.options)
    }
  }

  /**
   * Starts a single service.
   * @param {*} name Name of the service to start
   */
  startService (name) {
    let service = this.services[name]
    service
      .start()
      .then(() => {
        this.logger.log(`${service.name}: OK`)
      })
      .catch(() => {
        // TODO: Figure out how to handle errors here.
      })
  }

  /**
   * Starts all available services.
   */
  startServices () {
    for (let service in this.services) {
      this.startService(service)
    }
  }
}

module.exports = Plasma
