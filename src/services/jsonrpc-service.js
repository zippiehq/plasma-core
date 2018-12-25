const BaseService = require('./base-service')

const getAllFunctions = (instance, ignore = [], prefix = '') => {
  let fns = {}
  Object.getOwnPropertyNames(instance.constructor.prototype).forEach((prop) => {
    if (!ignore.includes(prop)) {
      fns[prefix + prop] = instance[prop]
    }
  })
  return fns
}

class JSONRPCService extends BaseService {
  constructor (options) {
    super()

    this.subdispatchers = [new ChainSubdispatcher()]
  }

  get name () {
    return 'jsonrpc-service'
  }

  getAllMethods () {
    return this.subdispatchers.map((subdispatcher) => {
      return subdispatcher.getMethods()
    }).reduce((pre, cur) => {
      return { ...pre, ...cur }
    })
  }

  getMethod (name) {
    const methods = this.getAllMethods()
    if (name in methods) {
      return methods[name]
    } else {
      throw new Error('JSONRPC method not found')
    }
  }

  async callMethod (name, params) {
    const method = this.getMethod(name)
    return method(...params)
  }

  // TODO: Handle Method Not Found errors.
  // TODO: Handle Invalid Request errors.
  // TODO: Handle Parse Error errors.
  // TODO: Handle Invalid Params errors.
  // TODO: Handle Internal Error errors.
  // TODO: Handle Server Error errors (?).
  async handle (jsonRequest) {
    const request = JSON.parse(jsonRequest)
    const result = this.callMethod(request.method, request.params)

    return JSON.stringify({
      jsonrpc: '2.0',
      result: result,
      id: request.id
    })
  }
}

class Subdispatcher {
  get prefix () {
    throw new Error('Classes that extend Subdispatcher must implement this method')
  }

  getMethods () {
    const ignore = ['constructor', 'prefix']
    return getAllFunctions(this, ignore, this.prefix)
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
