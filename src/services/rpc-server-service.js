const express = require('express')
const bodyParser = require('body-parser')

const BaseService = require('./base-service')

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
  }

  async stop () {
    this.server.close()
    this.started = false
  }
}

module.exports = RPCServerService
