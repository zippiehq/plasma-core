const express = require('express')
const bodyParser = require('body-parser')

const BaseService = require('./base-service')

class JSONRPCService extends BaseService {
  constructor (options) {
    super()

    this.subdispatchers = [ChainSubdispatcher]

    this.port = options.port
    this.server = express()
    this.server.use(bodyParser.urlencoded({ extended: true }))
    this.server.use(bodyParser.json())
  }

  get name () {
    return 'jsonrpc-service'
  }

  start () {
    this.server.listen(this.port)
    this.started = true
  }

  stop () {
    this.server.close()
    this.started = false
  }
}

class Subdispatcher {
  get prefix () {
    throw new Error('Classes that extend Subdispatcher must implement this method')
  }
}

class ChainSubdispatcher extends Subdispatcher {
  get prefix () {
    return 'pg_'
  }

  getBalance (address) {
    throw new Error('Not implemented')
  }

  getBlock (block) {
    throw new Error('Not implemented')
  }
}

module.exports = JSONRPCService
