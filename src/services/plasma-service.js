const BaseService = require('./base-service')

class PlasmaService extends BaseService {
  constructor (options) {
    super()
  }

  get name () {
    return 'plasma-service'
  }

  getTransaction (range, block) {
    // TODO: Should return null+proof or a transaction+proof
    throw new Error('Not implemented')
  }
}

module.exports = PlasmaService
