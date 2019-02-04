/**
 * Base class for JSON-RPC subdispatchers that handle requests.
 */
class BaseSubdispatcher {
  constructor (options) {
    this.options = options
    this.app = options.app
  }

  /**
   * Returns the JSON-RPC prefix of this subdispatcher.
   */
  get prefix () {
    throw new Error(
      'Classes that extend Subdispatcher must implement this method'
    )
  }
  /**
   * Returns an object with pointers to methods.
   */
  get methods () {
    throw new Error(
      'Classes that extend Subdispatcher must implement this method'
    )
  }

  /**
   * Returns all JSON-RPC methods of this subdispatcher.
   */
  getMethods () {
    let methods = {}
    for (let method in this.methods) {
      methods[this.prefix + method] = this.methods[method]
    }
    return methods
  }
}

module.exports = BaseSubdispatcher
