/**
 * Base class for JSON-RPC subdispatchers that handle requests.
 */
class BaseSubdispatcher {
  constructor (options) {
    this.options = options
    this.app = options.app
  }

  /**
   * Returns the list of services this subdispatcher depends on.
   * @return {Array<string>} List of depdendencies.
   */
  get dependencies () {
    return []
  }

  /**
   * Returns the JSON-RPC prefix of this subdispatcher.
   * @return {string} The prefix.
   */
  get prefix () {
    throw new Error(
      'Classes that extend Subdispatcher must implement this method'
    )
  }

  /**
   * Returns an object with pointers to methods.
   * @return {*} Names and pointers to handlers.
   */
  get methods () {
    throw new Error(
      'Classes that extend Subdispatcher must implement this method'
    )
  }

  /**
   * Returns all JSON-RPC methods of this subdispatcher.
   * @return {*} Prefixed names and pointers to handlers.
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
