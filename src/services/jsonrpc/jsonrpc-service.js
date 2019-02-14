const BaseService = require('../base-service')
const subdispatchers = require('./subdispatchers')

const JSONRPC_ERRORS = {
  PARSE_ERROR: {
    code: -32700,
    message: 'Parse error'
  },
  INVALID_REQUEST: {
    code: -32600,
    message: 'Invalid request'
  },
  METHOD_NOT_FOUND: {
    code: -32601,
    message: 'Method not found'
  },
  INVALID_PARAMS: {
    code: -32602,
    message: 'Invalid params'
  },
  INTERNAL_ERROR: {
    code: -32603,
    message: 'Internal error'
  }
}

/**
 * Service that handles and responds to JSON-RPC requests.
 */
class JSONRPCService extends BaseService {
  constructor (options) {
    super(options)

    this.subdispatchers = []
    for (let subdispatcher in subdispatchers) {
      this._registerSubdispatcher(subdispatchers[subdispatcher])
    }
  }

  get dependencies () {
    return this.subdispatchers.reduce((dependencies, subdispatcher) => {
      return dependencies.concat(subdispatcher.dependencies)
    }, [])
  }

  get name () {
    return 'jsonrpc'
  }

  /**
   * Returns all methods of all subdispatchers.
   * @return {Object} All subdispatcher methods as a single object.
   */
  getAllMethods () {
    return this.subdispatchers
      .map((subdispatcher) => {
        return subdispatcher.getMethods()
      })
      .reduce((pre, cur) => {
        return { ...pre, ...cur }
      })
  }

  /**
   * Returns a single method.
   * @param {string} name Name of the method to return.
   * @return {function} The method with the given name or
   * `undefined` if the method does not exist.
   */
  getMethod (name) {
    const methods = this.getAllMethods()
    if (name in methods) {
      return methods[name]
    }
  }

  /**
   * Calls the method with the given name and parameters.
   * @param {string} method Name of the method to call.
   * @param {Array} params Parameters to be used as arguments to the method.
   * @return {*} Result of the function call.
   */
  async handle (method, params = []) {
    const fn = this.getMethod(method)
    return fn(...params)
  }

  /**
   * Handles a raw (JSON) JSON-RPC request.
   * @param {Object} request A JSON-RPC request object.
   * @return {string} Result of the JSON-RPC call.
   */
  async handleRawRequest (request) {
    if (!('method' in request && 'id' in request)) {
      return this._buildError('INVALID_REQUEST', null)
    }

    if (!this.getMethod(request.method)) {
      return this._buildError('METHOD_NOT_FOUND', request.id)
    }

    let result
    try {
      result = await this.handle(request.method, request.params)
    } catch (err) {
      this.logger(`ERROR: ${err}`)
      return this._buildError('INTERNAL_ERROR', request.id, err)
    }

    return JSON.stringify({
      jsonrpc: '2.0',
      result: result,
      id: request.id
    })
  }

  /**
   * Builds a JSON-RPC error response.
   * @param {string} type Error type.
   * @param {string} id RPC command ID.
   * @return {Object} A stringified JSON-RPC error response.
   */
  _buildError (type, id, err) {
    return JSON.stringify({
      jsonrpc: '2.0',
      error: JSONRPC_ERRORS[type],
      message: err.toString(),
      id: id
    })
  }

  /**
   * Registers a new subdispatcher to this service.
   * @param {*} Dispatcher Subdispatcher to register.
   */
  _registerSubdispatcher (Dispatcher) {
    this.subdispatchers.push(
      new Dispatcher({
        app: this.app
      })
    )
  }
}

module.exports = JSONRPCService
