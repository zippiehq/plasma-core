const EphemDBProvider = require('../src/services/db').EphemDBProvider

const app = {
  services: {
    chain: {
      addTransaction: (transaction) => {
        return true
      }
    },
    db: new EphemDBProvider({
      app: this
    })
  }
}

module.exports = app
