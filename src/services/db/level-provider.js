const levelup = require('levelup')
const leveldown = require('leveldown')
const AsyncLock = require('async-lock')

const BaseDBProvider = require('./base-provider')

/**
 * LevelDB wrapper.
 */
class LevelDBProvider extends BaseDBProvider {
  constructor (options) {
    super(options)

    this.lock = new AsyncLock()
    this.dbPath = options.dbPath
    this.db = levelup(leveldown(this.dbPath))
  }

  async stop () {
    this.started = false
    return this.db.close()
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

    const result = await this.db.get(key, { asBuffer: false })
    return this._isJson(result) ? JSON.parse(result) : result
  }

  async set (key, value) {
    if (!(value instanceof String || typeof value === 'string')) {
      value = JSON.stringify(value)
    }

    return this.lock.acquire(key, () => {
      return this.db.put(key, value)
    })
  }

  async delete (key) {
    return this.lock.acquire(key, () => {
      return this.db.del(key)
    })
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

  get iterator () {
    return this.db.iterator
  }
}

module.exports = LevelDBProvider
