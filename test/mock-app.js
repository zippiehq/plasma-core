const EphemDB = require('../src/db/ephem-db')

const app = {
  services: {
    chain: {
      addTransaction: (transaction) => {
        return true
      }
    },
    db: new EphemDB()
  }
}

module.exports = app
