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

  async start () {
    chrome.runtime.onMessageExternal.addListener(this.handleRequest)
    this.started = true
  }

  async stop () {
    chrome.runtime.onMessageExternal.removeListener(this.handleRequest)
    this.started = false
  }
}

module.exports = ChromeServerService
