const BigNum = require('bn.js')
const BaseContractProvider = require('./base-provider')
const compiledContracts = require('plasma-contracts')
const plasmaChainCompiled = compiledContracts.plasmaChainCompiled
const erc20Compiled = compiledContracts.erc20Compiled

// TODO: Rename this.
class HttpContractProvider extends BaseContractProvider {
  async start () {
    this.started = true
    this.web3 = this.services.web3
    this.initContract()
    this.services.eventWatcher.subscribe('DepositEvent', (event) => {
      this.emitContractEvent('Deposit', this._castDepositEvent(event))
    })
  }

  async stop () {
    this.started = false
    this.removeAllListeners()
  }

  get address () {
    return this.contract.options.address
  }

  initContract () {
    if (this.contract) return
    this.contract = new this.web3.eth.Contract(plasmaChainCompiled.abi)
  }

  hasAddress () {
    return this.contract && this.address
  }

  async listToken (tokenAddress) {
    return this.contract.methods.listToken(tokenAddress, 0).send({
      from: await this.getOperator(),
      gas: 6000000 // TODO: How much should this be?
    })
  }

  async getTokenId (tokenAddress) {
    return this.contract.methods.listed(tokenAddress).call()
  }

  async deposit (token, amount, owner) {
    if (!this.hasAddress()) {
      throw new Error('Plasma Chain contract has not been connected')
    }

    amount = new BigNum(amount, 'hex')
    if (token.toString() === '0') {
      return this.depositETH(amount, owner)
    } else {
      return this.depositERC20(token, amount, owner)
    }
  }

  async depositETH (amount, owner) {
    return this.contract.methods.depositETH().send({
      from: owner,
      value: amount,
      gas: 6000000 // TODO: Figure out how much this should be.
    })
  }

  async depositERC20 (token, amount, owner) {
    const tokenAddress = await this.getTokenAddress(token)
    const tokenContract = new this.web3.eth.Contract(erc20Compiled.abi, tokenAddress)
    await tokenContract.methods.approve(this.address, amount).send({ from: owner })
    return this.contract.methods.depositERC20(tokenAddress, amount).send({
      from: owner,
      gas: 6000000 // TODO: Figure out how much this should be.
    })
  }

  async getTokenAddress (token) {
    if (this.web3.utils.isAddress(token)) {
      return token
    }
    return this.contract.methods['listings__contractAddress'](token.toString()).call()
  }

  // TODO: Rewrite when we add generic signature support.
  async submitBlock (hash) {
    return this.contract.methods.submitBlock(hash).send({
      from: await this.getOperator()
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
    return this.contract.methods
      .nextPlasmaBlockNumber()
      .call()
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
      token: new BigNum(values.tokenType, 10)
    }
  }
}

module.exports = HttpContractProvider
