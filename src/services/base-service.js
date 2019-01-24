const EventEmitter = require('events')

/**
 * A base class for services to extend.
 */
class BaseService extends EventEmitter {
  constructor (options = {}, defaultOptions = {}) {
    super()

    this.options = Object.assign({}, defaultOptions, options)
    this.app = options.app
    this.started = false
  }

  /**
   * Convenience method for getting available services.
   */
  get services () {
    return new Proxy(this.app.services, {
      get: (obj, prop) => {
        // Block services from trying to access inactive services.
        if (!obj[prop].started) {
          throw new Error(`Service not started: ${prop}`)
        }

        return obj[prop]
      }
    })
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
    this.started = true
  }

  /**
   * Stops the service.
   */
  async stop () {
    this.started = false
  }
}

module.exports = BaseService
