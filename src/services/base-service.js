const defaultOptions = {}

class BaseService {
  constructor (options) {
    this.options = { ...defaultOptions, options }
    this.started = false
  }

  get name () {
    throw new Error('Classes that extend BaseService must implement this method')
  }

  async start () {
    throw new Error('Classes that extend BaseService must implement this method')
  }

  async stop () {
    throw new Error('Classes that extend BaseService must implement this method')
  }
}

module.exports = BaseService
