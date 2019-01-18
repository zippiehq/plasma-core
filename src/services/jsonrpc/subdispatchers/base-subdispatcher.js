/**
 * Returns all the functions of a given class instance
 * @param {*} instance Class instance to be queried.
 * @param {*} ignore Names of functions to ignore.
 * @param {*} prefix A prefix to be added to each function.
 * @return {Object} An object that maps function names to functions.
 */
const getAllFunctions = (instance, ignore = [], prefix = '') => {
  let fns = {}
  Object.getOwnPropertyNames(instance.constructor.prototype).forEach((prop) => {
    if (!ignore.includes(prop)) {
      fns[prefix + prop] = instance[prop].bind(instance)
    }
  })
  return fns
}

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
   * Returns all JSON-RPC methods of this subdispatcher.
   */
  getMethods () {
    const ignore = ['constructor', 'prefix']
    return getAllFunctions(this, ignore, this.prefix)
  }
}

module.exports = BaseSubdispatcher
