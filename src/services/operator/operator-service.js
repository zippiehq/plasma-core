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
    return 'operator'
  }

  async start () {
    this._pollPendingTransactions()
  }

  async getPendingTransactions (address) {
    const pending = await this.provider.getPendingTransactions(address) || []
    return pending
  }

  getTransaction (hash) {
    return this.provider.getTransaction(hash)
  }

  sendTransaction (transaction) {
    return this.provider.sendTransaction(transaction)
  }

  async _pollPendingTransactions () {
    // TODO: Support multiple accounts.
    // TODO: Figure out how operator should remove pending transactions.
    // TODO: Figure out what to do if the operator tries to cheat.
    const accounts = await this.app.services.wallet.getAccounts()
    setInterval(async () => {
      this.logger.log('Checking for pending transactions')
      let pending = await this.getPendingTransactions(accounts[0])
      for (let hash of pending) {
        // Avoid importing the same transaction twice.
        if (await this.app.services.chain.hasTransaction(hash)) {
          continue
        }

        // Import the transaction if it's valid.
        this.logger.log(`Importing new transaction: ${hash}`)
        let transaction = await this.getTransaction(hash)
        transaction.hash = hash
        await this.app.services.chain.checkProofAndAddHistory(transaction)
      }
    }, 15000)
  }
}

module.exports = OperatorService
