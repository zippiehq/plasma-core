const BaseService = require('./base-service')

class ChromeServerService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  get name () {
    return 'chrome-service'
  }

  async handleRequest (request, _, sendResponse) {
    sendResponse(await this.app.jsonrpc.handle(request))
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
