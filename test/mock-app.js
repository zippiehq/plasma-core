const EphemDBProvider = require('../src/services/db/providers/ephem-provider')

const app = {
  services: {
    chain: {
      addTransaction: (transaction) => {
        return true
      }
    },
    db: new EphemDBProvider()
  }
}

module.exports = app
