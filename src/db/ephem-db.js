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
}

module.exports = EphemDB
