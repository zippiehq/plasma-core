const express = require('express')
const bodyParser = require('body-parser')

const BaseService = require('./base-service')

/**
 * Runs a JSON-RPC server and handles incoming requests.
 */
class RPCServerService extends BaseService {
  constructor (options) {
    super()

    this.port = options.port
    this.server = express()
    this.server.use(bodyParser.urlencoded({ extended: true }))
    this.server.use(bodyParser.json())
  }

  get name () {
    return 'rpc-server-service'
  }

  async start () {
    this.server.listen(this.port)
    this.started = true
    return true
  }

  async stop () {
    this.server.close()
    this.started = false
    return true
  }
}

module.exports = RPCServerService
