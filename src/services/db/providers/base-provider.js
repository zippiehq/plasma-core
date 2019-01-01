/**
 * Class that DB interfaces must implement.
 */
class BaseDBProvider {
  get name () {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  async get (key) {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  async set (key, value) {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  async delete (key) {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  async exists (key) {
    return new Error('Classes that extend BaseDB must implement this method')
  }
}

module.exports = BaseDBProvider
