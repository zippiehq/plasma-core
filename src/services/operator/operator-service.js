const BaseService = require('../base-service')
const MockOperatorProvider = require('./providers/mock-provider')
const HttpOperatorProvider = require('./providers/http-provider')

const providers = {
  'mock': MockOperatorProvider,
  'http': HttpOperatorProvider
}

/**
 * Wraps functionality to pull data from the operator.
 */
class OperatorService extends BaseService {
  constructor (options) {
    super()
    this.app = options.app
    this.logger = this.app.logger
    this.provider = new providers[options.provider]()
  }

  get name () {
    return 'operator-service'
  }

  async start () {
    this._pollPendingTransactions()
  }

  getPendingTransactions (address) {
    return this.provider.getPendingTransactions(address)
  }

  getTransaction (hash) {
    return this.provider.getTransaction(hash)
  }

  sendTransaction (transaction) {
    return this.provider.sendTransaction(transaction)
  }

  async _pollPendingTransactions () {
    // TODO: Support multiple accounts.
    const accounts = await this.app.services.wallet.getAccounts()
    setInterval(async () => {
      let pending = this.getPendingTransactions(accounts[0])
      for (let hash of pending) {
        this.logger.log(`Importing new transaction: ${hash}`)
        let transaction = await this.getTransaction(hash)
        await this.app.services.chain.checkProofAndAddHistory(transaction)
      }
    }, 15000)
  }
}

module.exports = OperatorService
