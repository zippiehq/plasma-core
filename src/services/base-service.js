const EventEmitter = require('events')

const defaultOptions = {}

/**
 * A base class for services to extend.
 */
class BaseService extends EventEmitter {
  constructor (options = {}) {
    super()

    this.options = Object.assign({}, defaultOptions, options)
    this.app = options.app
    this.started = false
  }

  /**
   * Convenience method for getting available services.
   */
  get services () {
    return this.app.services
  }

  /**
   * Returns the name of this service.
   * @return {string} Name of the service.
   */
  get name () {
    throw new Error(
      'Classes that extend BaseService must implement this method'
    )
  }

  /**
   * Starts the service.
   */
  async start () {
    throw new Error(
      'Classes that extend BaseService must implement this method'
    )
  }

  /**
   * Stops the service.
   */
  async stop () {
    throw new Error(
      'Classes that extend BaseService must implement this method'
    )
  }
}

module.exports = BaseService
