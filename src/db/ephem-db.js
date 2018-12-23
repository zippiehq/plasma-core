class EphemDB {
  constructor () {
    this.db = new Map()
  }

  get (key) {
    return this.db.get(key)
  }

  set (key, value) {
    this.db.set(key, value)
  }

  delete (key) {
    this.db.delete(key)
  }

  exists (key) {
    return this.db.has(key)
  }
}

module.exports = EphemDB
