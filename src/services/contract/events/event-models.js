const BigNum = require('bn.js')
const utils = require('plasma-utils')
const web3Utils = utils.utils.web3Utils

/**
 * Parses an Ethereum event.
 * Converts number-like strings into BigNums.
 * @param {*} event An Ethereum event.
 * @return {*} A parsed event.
 */
const parseEvent = (event) => {
  const parsed = event.returnValues
  for (const key in parsed) {
    const value = parsed[key]
    if (!isNaN(value) && !utils.utils.web3Utils.isAddress(value)) {
      parsed[key] = new BigNum(value, 10)
    }
  }
  parsed.eventBlockNumber = new BigNum(event.blockNumber, 10)
  return parsed
}

class DepositEvent {
  constructor (event) {
    const parsed = parseEvent(event)

    this.owner = parsed.depositer
    this.start = parsed.untypedStart
    this.end = parsed.untypedEnd
    this.token = parsed.tokenType
    this.block = parsed.plasmaBlockNumber
    this.amount = this.end.sub(this.start)
  }
}

class BlockSubmittedEvent {
  constructor (event) {
    const unparsed = Object.assign({}, event.returnValues)
    const parsed = parseEvent(event)

    this.number = parsed.blockNumber.toNumber()
    this.hash = unparsed.submittedHash
  }
}

class ExitStartedEvent {
  constructor (event) {
    const parsed = parseEvent(event)

    this.token = parsed.tokenType
    this.start = parsed.untypedStart
    this.end = parsed.untypedEnd
    this.id = parsed.exitID
    this.block = parsed.eventBlockNumber
    this.exiter = parsed.exiter
  }
}

class ExitFinalizedEvent {
  constructor (event) {
    const parsed = parseEvent(event)

    this.token = parsed.tokenType
    this.start = parsed.untypedStart
    this.end = parsed.untypedEnd
    this.id = parsed.exitID
  }
}

class ChainCreatedEvent {
  constructor (event) {
    const unparsed = Object.assign({}, event.returnValues)

    this.plasmaChainAddress = unparsed.PlasmaChainAddress
    this.plasmaChainName = web3Utils.hexToAscii(unparsed.PlasmaChainName)
    this.operatorEndpoint = encodeURI(
      web3Utils.hexToAscii(unparsed.PlasmaChainIP)
    ).replace(/%00/gi, '')
    this.operatorAddress = unparsed.OperatorAddress
  }
}

module.exports = {
  DepositEvent,
  BlockSubmittedEvent,
  ExitStartedEvent,
  ExitFinalizedEvent,
  ChainCreatedEvent
}
