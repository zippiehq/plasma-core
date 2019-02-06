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
   * Convenience method for accessing debug loggers.
   */
  get loggers () {
    return this.app.loggers
  }

  /**
   * Returns a default logger based on the service's name.
   */
  get logger () {
    return this.loggers[`service:${this.name}`]
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
   * List of services this service depends on, identified by name.
   * @return {Array<string>} List of dependencies.
   */
  get dependencies () {
    return []
  }

  /**
   * Checks whether the service and all of its dependencies are started.
   * @return {boolean} `true` if all started, `false` otherwise.
   */
  get healthy () {
    return (
      this.started &&
      this.dependencies.every((dependency) => {
        return this.app.services[dependency].started
      })
    )
  }

  /**
   * Starts the service.
   */
  async start () {
    this.started = true
    await this._onStart()
  }

  /**
   * Called once the service has been started.
   */
  async _onStart () {
    return true
  }

  /**
   * Stops the service.
   */
  async stop () {
    this.started = false
    await this._onStop()
  }

  /**
   * Called once the service has been stopped.
   */
  async _onStop () {
    return true
  }
}

module.exports = BaseService
