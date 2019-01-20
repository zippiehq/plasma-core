const EphemDBProvider = require('../src/services/db').EphemDBProvider
const RangeManager = require('../src/services/chain/range-manager-service')
const ETHService = require('../src/services/eth/eth-service')
const MockWalletProvider = require('../src/services/wallet/mock-provider')

class App {
  constructor () {
    this.services = {}
    this.reset()
  }

  async startServices () {
    for (let service in this.services) {
      await this.services[service].start()
    }
  }

  async stopServices () {
    for (let service in this.services) {
      await this.services[service].stop()
    }
  }

  registerService (service) {
    this.services[service.name] = service
  }

  async reset () {
    await this.stopServices()
    this.services = {}

    this.services.chain = {
      started: true,
      addTransaction: () => {
        return true
      },
      start: async () => { return true },
      stop: async () => { return true }
    }
    this.services.db = new EphemDBProvider({ app: this })
    this.services.rangeManager = new RangeManager({ app: this })
    this.services.eth = new ETHService({ app: this })
    this.services.wallet = new MockWalletProvider({ app: this })

    await this.startServices()
  }
}

module.exports = new App()
