class EphemDB {
  constructor () {
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

module.exports = EphemDB
