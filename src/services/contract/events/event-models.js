const BigNum = require('bn.js')
const utils = require('plasma-utils')

/**
 * Parses an Ethereum event.
 * Converts number-like strings into BigNums.
 * @param {*} event An Ethereum event.
 * @return {*} A parsed event.
 */
const parseEvent = (event) => {
  const values = event.returnValues
  for (const key in values) {
    const value = values[key]
    if (!isNaN(value) && !utils.utils.web3Utils.isAddress(value)) {
      values[key] = new BigNum(value, 10)
    }
  }
  values.eventBlockNumber = new BigNum(event.blockNumber, 10)
  return values
}

/**
 * Base class that event models extend.
 */
class BaseEventModel {
  constructor (event) {
    this.unparsed = Object.assign({}, event.returnValues)
    this.parsed = parseEvent(event)
  }

  /**
   * Returns the `original` name of this event.
   * @return {string} Name of the event.
   */
  get name () {
    throw new Error(
      'Classes that extend BaseEventModel must implement this method'
    )
  }
}

class DepositEvent extends BaseEventModel {
  constructor (event) {
    super(event)
    this.owner = this.parsed.depositer
    this.start = this.parsed.untypedStart
    this.end = this.parsed.untypedEnd
    this.token = this.parsed.tokenType
    this.block = this.parsed.plasmaBlockNumber
    this.amount = this.end.sub(this.start)
  }

  get name () {
    return 'DepositEvent'
  }
}

class BlockSubmittedEvent extends BaseEventModel {
  constructor (event) {
    super(event)
    this.number = this.parsed.blockNumber.toNumber()
    this.hash = this.unparsed.submittedHash
  }

  get name () {
    return 'SubmitBlockEvent'
  }
}

class ExitStartedEvent extends BaseEventModel {
  constructor (event) {
    super(event)
    this.token = this.parsed.tokenType
    this.start = this.parsed.untypedStart
    this.end = this.parsed.untypedEnd
    this.id = this.parsed.exitID
    this.block = this.parsed.eventBlockNumber
    this.exiter = this.parsed.exiter
  }

  get name () {
    return 'BeginExitEvent'
  }
}

class ExitFinalizedEvent extends BaseEventModel {
  constructor (event) {
    super(event)
    this.token = this.parsed.tokenType
    this.start = this.parsed.untypedStart
    this.end = this.parsed.untypedEnd
    this.id = this.parsed.exitID
  }

  get name () {
    return 'FinalizeExitEvent'
  }
}

module.exports = {
  DepositEvent,
  BlockSubmittedEvent,
  ExitStartedEvent,
  ExitFinalizedEvent
}
