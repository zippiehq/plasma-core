const Chain = require('../chain')

class ChainService {
  constructor () {
    this.db = {}
    this.chain = new Chain(this.db)
  }

  isSyncing () {
    throw Error('Not implemented')
  }
}

module.exports = ChainService
