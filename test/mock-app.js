const EphemDBProvider = require('../src/services/db').EphemDBProvider
const RangeManager = require('../src/services/range-manager-service')
const ETHService = require('../src/services/eth/eth-service')

class App {
  constructor () {
    this.services = {}
    this.services.chain = {
      started: true,
      addTransaction: (transaction) => {
        return true
      }
    }
    this.services.db = new EphemDBProvider({ app: this })
    this.services.rangeManager = new RangeManager({ app: this })
    this.services.eth = new ETHService({ app: this })

    this.startServices()
  }

  async startServices () {
    await this.services.db.start()
    await this.services.rangeManager.start()
    await this.services.eth.start()
  }
}

module.exports = new App()
