const BaseDBProvider = require('./base-provider')

/**
 * Simple ephemeral database for testing.
 */
class EphemDBProvider extends BaseDBProvider {
  constructor (options) {
    super(options)

    this.db = new Map()
  }

  async get (key, fallback) {
    const exists = await this.exists(key)
    if (!exists) {
      if (arguments.length === 2) {
        return fallback
      } else {
        throw new Error('Key not found in database')
      }
    }

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
