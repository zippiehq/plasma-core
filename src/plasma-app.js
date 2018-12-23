const DBService = require('./services/db-service')
const JSONRPCService = require('./services/jsonrpc-service')
const RPCServerService = require('./services/rpc-server-service')

class PlasmaApp {
  constructor (options) {
    this.options = options

    this.services = {}
    this.services.db = new DBService({
      app: this,
      db: options.dbBackend
    })
    this.services.rpcServer = new RPCServerService({
      app: this,
      port: options.rpcPort
    })
    this.services.jsonrpc = new JSONRPCService({
      app: this
    })
  }
}

module.exports = PlasmaApp
