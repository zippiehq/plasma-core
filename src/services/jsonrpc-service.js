const BaseService = require('./base-service')

const getAllFunctions = (cls) => {
  return Object.getOwnPropertyNames(cls.prototype)
}

class JSONRPCService extends BaseService {
  constructor (options) {
    super()

    this.subdispatchers = [new ChainSubdispatcher()]
  }

  get name () {
    return 'jsonrpc-service'
  }

  // TODO: Have this return an object, not a list of strings
  getMethods () {
    return this.subdispatchers.map((subdispatcher) => {
      return subdispatcher.getMethods()
    }).reduce((pre, cur) => {
      return pre.concat(cur)
    })
  }

  async handle (request) {
    throw new Error('Not implemented')
  }
}

class Subdispatcher {
  get prefix () {
    throw new Error('Classes that extend Subdispatcher must implement this method')
  }

  getMethods () {
    const ignore = ['constructor', 'prefix']

    return getAllFunctions(this.constructor).filter((fn) => {
      return !ignore.includes(fn)
    }).map((fn) => {
      return this.prefix + fn
    })
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
