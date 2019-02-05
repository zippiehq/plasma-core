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
    this.event = parseEvent(event)
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
    this.owner = this.event.depositer
    this.start = this.event.untypedStart
    this.end = this.event.untypedEnd
    this.token = this.event.tokenType
    this.block = this.event.plasmaBlockNumber
    this.amount = this.end.sub(this.start)
  }

  get name () {
    return 'DepositEvent'
  }
}

class BlockSubmittedEvent extends BaseEventModel {
  constructor (event) {
    super(event)
    this.number = this.event.blockNumber.toNumber()
    this.hash = this.event.submittedHash
  }

  get name () {
    return 'SubmitBlockEvent'
  }
}

class ExitStartedEvent extends BaseEventModel {
  constructor (event) {
    super(event)
    this.token = this.event.tokenType
    this.start = this.event.untypedStart
    this.end = this.event.untypedEnd
    this.id = this.event.exitID
    this.block = this.event.eventBlockNumber
    this.exiter = this.event.exiter
  }

  get name () {
    return 'BeginExitEvent'
  }
}

class ExitFinalizedEvent extends BaseEventModel {
  constructor (event) {
    super(event)
    this.token = this.event.tokenType
    this.start = this.event.untypedStart
    this.end = this.event.untypedEnd
    this.id = this.event.exitID
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
