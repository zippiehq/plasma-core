const DBService = require('./services/db-service')
const JSONRPCService = require('./services/jsonrpc-service')

class PlasmaApp {
  constructor (options) {
    this.options = options

    this.services = {}
    this.services.db = new DBService({
      app: this,
      db: options.dbBackend
    })
    this.services.jsonrpc = new JSONRPCService({
      app: this,
      port: options.rpcPort
    })
  }
}

module.exports = PlasmaApp
