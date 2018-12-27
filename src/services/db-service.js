const BaseService = require('./base-service')
const EphemDB = require('../db/ephem-db')

const dbs = {
  'ephem': EphemDB
}

/**
 * Wraps and simplifies database calls.
 */
class DBService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
    this.db = new dbs[options.db]()
  }

  get name () {
    return 'db-service'
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
