const BaseService = require('./base-service')

/**
 * Listens for requests from webpages when running a node in a chrome extension.
 */
class ChromeServerService extends BaseService {
  constructor (options) {
    super()

    this.app = options.app
  }

  get name () {
    return 'chrome'
  }

  /**
   * Handles a JSON-RPC request and sends a response back to the client.
   * @param {*} request Request to be handled.
   * @param {*} sender Sender of the request.
   * @param {*} sendResponse Chrome-specific function used to send back a response.
   */
  async handleRequest (request, sender, sendResponse) {
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
