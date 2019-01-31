const BigNum = require('bn.js')
const BaseContractProvider = require('./base-provider')
const compiledContracts = require('plasma-contracts')
const plasmaChainCompiled = compiledContracts.plasmaChainCompiled
const erc20Compiled = compiledContracts.erc20Compiled

// TODO: Rename this.
class HttpContractProvider extends BaseContractProvider {
  async start () {
    this.started = true
    this.initContract()
    this.initContractAddress()

    // Subscribe to events.
    // TODO: Rethink where event watching happens.
    this.services.eventWatcher.subscribe(
      'DepositEvent',
      this._onDeposit.bind(this)
    )
    this.services.eventWatcher.subscribe(
      'SubmitBlockEvent',
      this._onBlockSubmitted.bind(this)
    )
    this.services.eventWatcher.subscribe(
      'BeginExitEvent',
      this._onExitStarted.bind(this)
    )
    this.services.eventWatcher.subscribe(
      'FinalizeExitEvent',
      this._onExitFinalized.bind(this)
    )
  }

  async stop () {
    this.started = false
    this.removeAllListeners()
  }

  get address () {
    return this.contract.options.address
  }

  get web3 () {
    return this.services.web3
  }

  initContract () {
    if (this.contract) return
    this.contract = new this.web3.eth.Contract(plasmaChainCompiled.abi)
  }

  async initContractAddress () {
    // TODO: Replace this because we should really be getting
    // the address from the registry.
    if (this.services.operator.getEthInfo) {
      await this.services.operator.waitForConnection()
      const ethInfo = await this.services.operator.getEthInfo()
      this.contract.options.address = ethInfo.plasmaChainAddress
    }
    this.logger(`Contract address set: ${this.address}`)
  }

  hasAddress () {
    return this.contract && this.address
  }

  async checkAccountUnlocked (address) {
    if (this.services.wallet.addAccountToWallet) {
      await this.services.wallet.addAccountToWallet(address)
    }
  }

  async listToken (tokenAddress) {
    const operator = await this.getOperator()
    await this.checkAccountUnlocked(operator)

    return this.contract.methods.listToken(tokenAddress, 0).send({
      from: operator,
      gas: 6000000 // TODO: How much should this be?
    })
  }

  async getChallengePeriod () {
    return this.contract.methods['CHALLENGE_PERIOD']().call()
  }

  async getTokenId (tokenAddress) {
    return this.contract.methods.listed(tokenAddress).call()
  }

  async deposit (token, amount, owner) {
    if (!this.hasAddress()) {
      throw new Error('Plasma chain contract address has not yet been set.')
    }
    await this.checkAccountUnlocked(owner)

    amount = new BigNum(amount, 'hex')
    if (token.toString() === '0') {
      return this._depositETH(amount, owner)
    } else {
      return this._depositERC20(token, amount, owner)
    }
  }

  async _depositETH (amount, owner) {
    return this.contract.methods.depositETH().send({
      from: owner,
      value: amount,
      gas: 6000000 // TODO: Figure out how much this should be.
    })
  }

  async _depositERC20 (token, amount, owner) {
    const tokenAddress = await this.getTokenAddress(token)
    const tokenContract = new this.web3.eth.Contract(
      erc20Compiled.abi,
      tokenAddress
    )
    await tokenContract.methods
      .approve(this.address, amount)
      .send({ from: owner })
    return this.contract.methods.depositERC20(tokenAddress, amount).send({
      from: owner,
      gas: 6000000 // TODO: Figure out how much this should be.
    })
  }

  async startExit (block, token, start, end, owner) {
    await this.checkAccountUnlocked(owner)
    return this.contract.methods.beginExit(token, block, start, end).send({
      from: owner,
      gas: 1000000
    })
  }

  async finalizeExit (exitId, exitableEnd, owner) {
    await this.checkAccountUnlocked(owner)
    return this.contract.methods.finalizeExit(exitId, exitableEnd).send({
      from: owner,
      gas: 6000000
    })
  }

  async getTokenAddress (token) {
    if (this.web3.utils.isAddress(token)) {
      return token
    }
    return this.contract.methods['listings__contractAddress'](
      token.toString()
    ).call()
  }

  // TODO: Rewrite when we add generic signature support.
  async submitBlock (hash) {
    const operator = await this.getOperator()
    await this.checkAccountUnlocked(operator)
    return this.contract.methods.submitBlock(hash).send({
      from: operator
    })
  }

  async depositValid (deposit) {
    const depositEvents = await this.contract.getPastEvents('DepositEvent', {
      filter: {
        depositer: deposit.owner
        // block: deposit.block
      },
      fromBlock: 0
    })
    return depositEvents.some((event) => {
      const casted = this._castDepositEvent(event)
      return (
        casted.owner === deposit.owner &&
        casted.start.eq(deposit.start) &&
        casted.end.eq(deposit.end) &&
        casted.token.eq(deposit.token)
      )
    })
  }

  async getBlock (block) {
    return this.contract.methods.blockHashes(block).call()
  }

  async getNextBlock () {
    return this.contract.methods.nextPlasmaBlockNumber().call()
  }

  async getCurrentBlock () {
    const nextBlockNumber = await this.getNextBlock()
    return nextBlockNumber - 1
  }

  async getOperator () {
    return this.contract.methods.operator().call()
  }

  /**
   * Casts a DepositEvent to a Deposit.
   * @param {*} depositEvent A DepositEvent.
   * @return A Deposit object.
   */
  _castDepositEvent (depositEvent) {
    const values = depositEvent.returnValues
    return {
      owner: values.depositer,
      start: new BigNum(values.untypedStart, 10),
      end: new BigNum(values.untypedEnd, 10),
      token: new BigNum(values.tokenType, 10),
      block: new BigNum(values.plasmaBlockNumber, 10)
    }
  }

  _castBlockSubmittedEvent (event) {
    const values = event.returnValues
    return {
      number: new BigNum(values.blockNumber, 10).toNumber(),
      hash: values.submittedHash
    }
  }

  _castExitStartedEvent (event) {
    const values = event.returnValues
    return {
      token: new BigNum(values.token, 10),
      start: new BigNum(values.untypedStart, 10),
      end: new BigNum(values.untypedEnd, 10),
      id: new BigNum(values.exitID, 10),
      block: new BigNum(event.blockNumber, 10),
      exiter: values.exiter
    }
  }

  _castFinalizeExitEvent (event) {
    const values = event.returnValues
    return {
      token: new BigNum(values.token, 10),
      start: new BigNum(values.untypedStart, 10),
      end: new BigNum(values.untypedEnd, 10),
      id: new BigNum(values.exitID, 10)
    }
  }

  _onDeposit (events) {
    const deposits = events.map(this._castDepositEvent)
    deposits.forEach((deposit) => {
      const amount = deposit.end.sub(deposit.start).toString()
      this.logger(
        `Detected new deposit of ${amount} [${deposit.token}] for ${
          deposit.owner
        }`
      )
    })
    this.emitContractEvent('Deposit', deposits)
  }

  _onBlockSubmitted (events) {
    const blocks = events.map(this._castBlockSubmittedEvent)
    blocks.forEach((block) => {
      this.logger(`Detected block #${block.number}: ${block.hash}`)
    })
    this.emitContractEvent('BlockSubmitted', blocks)
  }

  _onExitStarted (events) {
    const exits = events.map(this._castExitStartedEvent)
    exits.forEach((exit) => {
      this.logger(`Detected new started exit: ${exit.id}`)
    })
    this.emitContractEvent('ExitStarted', exits)
  }

  _onExitFinalized (events) {
    const exits = events.map(this._castFinalizeExitEvent)
    exits.forEach((exit) => {
      this.logger(`Detected new finalized exit: ${exit.id}`)
    })
    this.emitContractEvent('ExitFinalized', exits)
  }
}

module.exports = HttpContractProvider
