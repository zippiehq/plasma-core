const utils = require('plasma-utils')

const DBService = require('./services/db-service')
const JSONRPCService = require('./services/jsonrpc-service')
const RPCServerService = require('./services/rpc-server-service')
const ChainService = require('./services/chain-service')
const OperatorService = require('./services/operator/operator-service')
const WalletService = require('./services/wallet/wallet-service')

/**
 * Main class that runs and manages all services.
 */
class PlasmaApp {
  constructor (options) {
    this.options = options
    this.services = {}
    this.logger = new utils.logging.DefaultLogger()

    this._registerServices()
    this._startServices()
  }

  /**
   * Registers all services.
   */
  _registerServices () {
    const services = [
      {
        type: DBService,
        options: {
          db: this.options.dbBackend
        }
      },
      {
        type: RPCServerService,
        options: {
          port: this.options.port
        }
      },
      { type: JSONRPCService },
      { type: ChainService },
      {
        type: OperatorService,
        options: {
          provider: this.options.operatorProvider
        }
      },
      {
        type: WalletService,
        options: {
          provider: this.options.walletProvider
        }
      }
    ]

    for (let service of services) {
      this._registerService(service.type, service.options)
    }
  }

  /**
   * Registers a single service to the app.
   * @param {*} Service Class of the service to register.
   * @param {*} options Any additional options.
   */
  _registerService (Service, options = {}) {
    const appInject = { app: this }
    const service = new Service({ ...options, ...appInject })
    this.services[service.name] = service
  }

  /**
   * Starts all available services.
   */
  _startServices () {
    for (let serviceId in this.services) {
      let service = this.services[serviceId]
      service.start().then(() => {
        this.logger.log(`${service.name}: OK`)
      }).catch(() => {
        // TODO: Figure out how to handle errors here.
      })
    }
  }
}

module.exports = PlasmaApp
