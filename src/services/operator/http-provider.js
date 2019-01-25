const axios = require('axios')
const uuidv4 = require('uuid/v4')
const utils = require('plasma-utils')
const models = utils.serialization.models
const UnsignedTransaction = models.UnsignedTransaction
const SignedTransaction = models.SignedTransaction

const BaseOperatorProvider = require('./base-provider')

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
const defaultOptions = {
  url: 'http://localhost:9898'
}

/**
 * Service that wraps the interface to the operator.
 */
class HttpOperatorProvider extends BaseOperatorProvider {
  constructor (options) {
    super(options, defaultOptions)
    this.http = axios.create({
      baseURL: options.url
    })
  }

  async getTransactions (address, start, end) {
    return this._handle('getTransactions', [address, start, end])
  }

  async getTransaction (encoded) {
    const tx = new UnsignedTransaction(encoded)
    const rawProof = await this._handle('getHistoryProof', [
      0,
      tx.block,
      encoded
    ])

    // Parse the raw proof.
    let proof = []
    let deposits = []
    for (let transactionProof of rawProof) {
      let transfer = transactionProof.transaction.transfers[0]
      // Transfers from the zero address are deposits.
      if (transfer.sender === NULL_ADDRESS) {
        deposits.push(transfer)
      } else {
        proof.push(transactionProof)
      }
    }

    return {
      transaction: tx,
      proof: proof,
      deposits: deposits
    }
  }

  async sendTransaction (transaction) {
    const tx = new SignedTransaction(transaction)
    return this._handle('addTransaction', [tx.encoded])
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
