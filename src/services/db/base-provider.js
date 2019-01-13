const BaseService = require('../base-service')

/**
 * Class that DB interfaces must implement.
 */
class BaseDBProvider extends BaseService {
  constructor (options = {}) {
    super()
    this.app = options.app
  }

  get name () {
    return 'db'
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
