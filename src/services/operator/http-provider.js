const axios = require('axios')
const uuidv4 = require('uuid/v4')
const utils = require('plasma-utils')
const BigNum = require('bn.js')
const models = utils.serialization.models
const UnsignedTransaction = models.UnsignedTransaction
const SignedTransaction = models.SignedTransaction
const TransferProof = models.TransferProof

const BaseOperatorProvider = require('./base-provider')

const defaultOptions = {
  operatorEndpoint: 'http://localhost:9898',
  operatorPingInterval: 10000
}

/**
 * Service that wraps the interface to the operator.
 */
class HttpOperatorProvider extends BaseOperatorProvider {
  constructor (options) {
    super(options, defaultOptions)
    this.http = axios.create({
      baseURL: options.operatorEndpoint
    })
    this.online = false
  }

  async start () {
    this.started = true
    this._pingInterval()
  }

  async getNextBlock () {
    return parseInt(await this._handle('getBlockNumber'))
  }

  async getEthInfo () {
    return this._handle('getEthInfo')
  }

  async getTransactions (address, start, end) {
    const txs = await this._handle('getTransactions', [address, start, end])
    return txs.map((tx) => {
      return Buffer.from(tx).toString('hex')
    })
  }

  async getTransaction (encoded) {
    const tx = new SignedTransaction(encoded)
    const rawProof = await this._handle('getHistoryProof', [
      0,
      tx.block,
      encoded
    ])

    const deposits = rawProof.deposits
      .map((deposit) => {
        const transfer = deposit.transfers[0]
        return {
          block: new BigNum(deposit.block, 'hex'),
          token: new BigNum(transfer.token, 'hex'),
          start: new BigNum(transfer.start, 'hex'),
          end: new BigNum(transfer.end, 'hex'),
          owner: transfer.recipient
        }
      })
      .sort((a, b) => {
        return a.start.sub(b.start)
      })
      .reduce((a, b) => {
        // Remove any duplicates.
        if (a.length === 0 || a.slice(-1)[0].start !== b.start) a.push(b)
        return a
      }, [])

    const earliestBlock = deposits.reduce((a, b) => {
      return a.block.lt(b.block) ? a : b
    }).block

    // TODO: This is really ugly and should be broken out for readibility.
    let prevBlock = earliestBlock
    const txProofs = Object.keys(rawProof.transactionHistory)
      .sort((a, b) => {
        return new BigNum(a, 10).sub(new BigNum(b, 10))
      })
      .reduce((proofs, block) => {
        // Fill in any missing blocks with fake transactions.
        while (!prevBlock.addn(1).eq(new BigNum(block, 10))) {
          proofs = proofs.concat([
            {
              transaction: {
                block: prevBlock.addn(1),
                transfers: []
              },
              transactionProof: {
                transferProofs: []
              }
            }
          ])
          prevBlock = prevBlock.addn(1)
        }
        prevBlock = new BigNum(block, 10)

        return proofs.concat(rawProof.transactionHistory[block])
      }, [])
      .map((txProof) => {
        return {
          transaction: new UnsignedTransaction(txProof.transaction),
          proof: txProof.transactionProof.transferProofs.map(
            (transferProof) => {
              return new TransferProof(transferProof)
            }
          )
        }
      })
      .sort((a, b) => {
        return a.transaction.block.sub(b.transaction.block)
      })
      .reduce((a, b) => {
        // Remove any duplicates.
        if (
          a.length === 0 ||
          a.slice(-1)[0].transaction.hash !== b.transaction.hash
        ) { a.push(b) }
        return a
      }, [])

    return {
      transaction: tx,
      proof: txProofs,
      deposits: deposits
    }
  }

  async sendTransaction (transaction) {
    const tx = new SignedTransaction(transaction)
    return this._handle('addTransaction', [tx.encoded])
  }

  async submitBlock () {
    return this._handle('newBlock')
  }

  async waitForConnection () {
    // Do this as a promise to avoid recursion limits.
    return new Promise((resolve) => {
      if (this.online) resolve()
      setInterval(() => {
        if (this.online) resolve()
      }, this.options.operatorPingInterval / 10)
    })
  }

  /**
   * Sends a JSON-RPC command as a HTTP POST request.
   * @param {string} method Name of the method to call.
   * @param {Array} params Any extra parameters.
   * @return {*} The result of the operation or an error.
   */
  async _handle (method, params = []) {
    let response
    try {
      response = await this.http.post('/', {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: uuidv4()
      })
    } catch (err) {
      this.logger(`ERROR: ${err}`)
      throw err
    }
    const data = utils.utils.isString(response)
      ? JSON.parse(response.data)
      : response.data
    if (data.error) {
      throw data.error
    }
    return data.result
  }

  async _pingInterval () {
    try {
      await this.getEthInfo()
      if (!this.online) {
        this.logger('Successfully connected to operator')
      }
      this.online = true
    } catch (err) {
      this.online = false
      this.logger(
        'ERROR: Cannot connect to operator. Attempting to reconnect...'
      )
    } finally {
      await utils.utils.sleep(this.options.operatorPingInterval)
      this._pingInterval()
    }
  }
}

module.exports = HttpOperatorProvider
