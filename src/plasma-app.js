const DBService = require('./services/db-service')
const JSONRPCService = require('./services/jsonrpc-service')
const RPCServerService = require('./services/rpc-server-service')

/**
 * Main class that runs and manages all services.
 */
class PlasmaApp {
  constructor (options) {
    this.options = options
    this.services = {}
  }

  /**
   * Initializes and starts all available services.
   */
  startAllServices () {
    this.services.db = new DBService({
      app: this,
      db: this.options.dbBackend
    })
    this.services.rpcServer = new RPCServerService({
      app: this,
      port: this.options.rpcPort
    })
    this.services.jsonrpc = new JSONRPCService({
      app: this
    })
  }
}

module.exports = PlasmaApp
