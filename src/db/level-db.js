const levelup = require('levelup')
const leveldown = require('leveldown')

const BaseDB = require('./base-db')

/**
 * LevelDB wrapper.
 */
class LevelDB extends BaseDB {
  constructor (path) {
    super()
    this.db = levelup(leveldown(path))
  }

  async get (key) {
    return this.db.get(key)
  }

  async set (key, value) {
    return this.db.put(key, value)
  }

  async delete (key) {
    return this.db.del(key)
  }

  async exists (key) {
    try {
      await this.db.get(key)
      return true
    } catch (err) {
      if (err.notFound) {
        return false
      } else {
        throw err
      }
    }
  }
}

module.exports = LevelDB
