const EphemDBProvider = require('../src/services/db').EphemDBProvider
const RangeManager = require('../src/services/range-manager-service')

class App {
  constructor () {
    this.services = {}
    this.services.chain = {
      addTransaction: (transaction) => {
        return true
      }
    }
    this.services.db = new EphemDBProvider({
      app: this
    })
    this.services.rangeManager = new RangeManager({
      app: this
    })
  }
}

module.exports = new App()
