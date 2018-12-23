const DBService = require('./services/db-service')

class PlasmaApp {
  constructor (config) {
    this.config = config

    this.services = {}
    this.services.db = new DBService(this)
  }
}

module.exports = PlasmaApp