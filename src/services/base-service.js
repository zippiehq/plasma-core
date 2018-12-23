const defaultOptions = {}

class BaseService {
  constructor (options) {
    this.options = { ...defaultOptions, options }
    this.started = false
  }

  get name () {
    throw new Error('Not implemented')
  }

  async start () {
    throw new Error('Not implemented')
  }

  async stop () {
    throw new Error('Not implemented')
  }
}

module.exports = BaseService
