const DBService = require('./services/db-service')

class PlasmaApp {
  constructor (config) {
    this.config = config

    this.dbService = new DBService(this)
  }
}

module.exports = PlasmaApp
