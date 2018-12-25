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

  getMethods () {
    return this.subdispatchers.map((subdispatcher) => {
      return subdispatcher.getMethods()
    }).reduce((pre, cur) => {
      return { ...pre, ...cur }
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
