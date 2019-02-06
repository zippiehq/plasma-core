const BaseService = require('./base-service')

/**
 * Watches for invalid exits and automatically starts challenges.
 */
class GuardService extends BaseService {
  get name () {
    return 'guard'
  }

  get dependencies () {
    return ['eventHandler']
  }
}

module.exports = GuardService
