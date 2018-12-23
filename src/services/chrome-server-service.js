const BaseService = require('./base-service')

class ChromeServerService extends BaseService {
  constructor (options) {
    super()
  }

  get name () {
    return 'chrome-service'
  }

  handleRequest (request, sender, sendResponse) {
    throw new Error('Not implemented')
  }

  start () {
    chrome.runtime.onMessageExternal.addListener(this.handleRequest)
  }

  stop () {
    chrome.runtime.onMessageExternal.removeListener(this.handleRequest)
  }
}

module.exports = ChromeServerService
