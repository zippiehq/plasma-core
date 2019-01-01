const BaseService = require('../base-service')
const EphemDB = require('./providers/ephem-provider')
const LevelDB = require('./providers/level-provider')

// TODO: Move this into some sort of index file.
const providers = {
  'ephem': EphemDB,
  'level': LevelDB
}

// TODO: These "service" wrappers are super unnecessary. Let's get rid of them. Same goes for wallet and operator services.
/**
 * Wraps and simplifies database calls.
 */
class DBService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
    this.provider = new providers[options.db]()
  }

  get name () {
    return 'db'
  }

  async get (key) {
    return this.provider.get(key)
  }

  async set (key, value) {
    return this.provider.set(key, value)
  }

  async delete (key) {
    return this.provider.delete(key)
  }

  async exists (key) {
    return this.provider.exists(key)
  }
}

module.exports = DBService
