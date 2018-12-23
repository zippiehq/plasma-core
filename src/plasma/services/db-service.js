const EphemDB = require('../../db/ephem-db')

const dbs = {
  'ephem': EphemDB
}

class DBService {
  constructor (app) {
    this.db = new dbs[app.config.db]()
  }

  async get (key) {
    return this.db.get(key)
  }

  async set (key, value) {
    return this.db.set(key, value)
  }

  async delete (key) {
    return this.db.delete(key)
  }

  async exists (key) {
    return this.db.exists(key)
  }
}

module.exports = DBService
