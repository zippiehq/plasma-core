const BaseDBProvider = require('./base-provider')

/**
 * Simple ephemeral database for testing.
 */
class EphemDBProvider extends BaseDBProvider {
  constructor (options) {
    super(options)

    this.db = new Map()
  }

  async get (key) {
    return this.db.get(key)
  }

  async set (key, value) {
    this.db.set(key, value)
  }

  async delete (key) {
    this.db.delete(key)
  }

  async exists (key) {
    return this.db.has(key)
  }
}

module.exports = EphemDBProvider
