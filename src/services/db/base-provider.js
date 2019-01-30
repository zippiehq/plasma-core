const BaseService = require('../base-service')

/**
 * Class that DB interfaces must implement.
 */
class BaseDBProvider extends BaseService {
  get name () {
    return 'db'
  }

  /**
   * Returns the value stored at the given key.
   * @param {string} key Key to query.
   * @param {*} fallback A fallback value if the key doesn't exist.
   * @return {*} The stored value or the fallback.
   */
  async get (key, fallback) {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  /**
   * Sets a given key with the value.
   * @param {string} key Key to set.
   * @param {*} value Value to store.
   */
  async set (key, value) {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  /**
   * Deletes a given key from storage.
   * @param {string} key Key to delete.
   */
  async delete (key) {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  /**
   * Checks if a key exists in storage.
   * @param {string} key Key to check.
   * @return {boolean} `true` if the key exists, `false` otherwise.
   */
  async exists (key) {
    return new Error('Classes that extend BaseDB must implement this method')
  }

  /**
   * Checks if a thing is a valid JSON string.
   * @param {*} str Thing to check.
   * @return {boolean} `true` if it's a JSON string, `false` otherwise.
   */
  _isJson (str) {
    try {
      JSON.parse(str)
    } catch (err) {
      return false
    }
    return true
  }
}

module.exports = BaseDBProvider
