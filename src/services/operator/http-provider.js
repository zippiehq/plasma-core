const axios = require('axios')
const uuidv4 = require('uuid/v4')

const BaseOperatorProvider = require('./base-provider')

/**
 * Service that wraps the interface to the operator.
 */
class HttpOperatorProvider extends BaseOperatorProvider {
  constructor (options = {}) {
    super(options)
    this.http = axios.create({
      baseURL: options.url || 'http://localhost:9898'
    })
  }

  get name () {
    return 'http'
  }

  async getRangesByOwner (owner, startBlock) {
    return this._handle('op_getRangesByOwner', [owner, startBlock])
  }

  async getTransactionHistory (transaction, startBlock) {
    return this._handle('op_getTxHistory', [transaction, startBlock])
  }

  async sendTransaction (transaction) {
    return this._handle('op_sendTransaction', [transaction])
  }

  /**
   * Sends a JSON-RPC command as a HTTP POST request.
   * @param {string} method Name of the method to call.
   * @param {Array} params Any extra parameters.
   * @return {*} The result of the operation or an error.
   */
  async _handle (method, params) {
    const rawResponse = await this.http.post('/', {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: uuidv4()
    })
    const response = JSON.parse(rawResponse.data)
    if (response.error) {
      throw response.error
    }
    return response.result
  }
}

module.exports = HttpOperatorProvider
