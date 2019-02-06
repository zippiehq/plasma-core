const BigNum = require('bn.js')
const BaseContractProvider = require('./base-provider')
const compiledContracts = require('plasma-contracts')
const plasmaChainCompiled = compiledContracts.plasmaChainCompiled
const erc20Compiled = compiledContracts.erc20Compiled
const eventModels = require('./events/event-models')
const DepositEvent = eventModels.DepositEvent

/**
 * Wraps contract calls for clean access.
 */
class ContractProvider extends BaseContractProvider {
  get dependencies () {
    return ['web3', 'operator', 'wallet']
  }

  async _onStart () {
    this.initContract()
    this.initContractAddress()
  }

  /**
   * @return {string} Address of the connected contract.
   */
  get address () {
    return this.contract.options.address
  }

  /**
   * @return {boolean} `true` if the contract has an address, `false` otherwise.
   */
  get hasAddress () {
    return this.contract && this.address
  }

  /**
   * Returns the current web3 instance.
   * Mainly used for convenience.
   * @return {*} The current web3 instance.
   */
  get web3 () {
    return this.services.web3
  }

  /**
   * Initializes the contract instance.
   */
  initContract () {
    if (this.contract) return
    this.contract = new this.web3.eth.Contract(plasmaChainCompiled.abi)
  }

  /**
   * Initializes the contract address.
   * Currently just queries the address from the operator
   * but should really be getting it from the registry.
   */
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

  /**
   * Checks whether an account is unlocked
   * and attempts to unlock it if not.
   * @param {string} address Address of the account to check.
   */
  async checkAccountUnlocked (address) {
    if (this.services.wallet.addAccountToWallet) {
      await this.services.wallet.addAccountToWallet(address)
    }
  }

  /**
   * Queries a given block.
   * @param {number} block Number of the block to query.
   * @return {string} Root hash of the block with that number.
   */
  async getBlock (block) {
    return this.contract.methods.blockHashes(block).call()
  }

  /**
   * @return {number} Number of the block that will be submitted next.
   */
  async getNextBlock () {
    return this.contract.methods.nextPlasmaBlockNumber().call()
  }

  /**
   * @return {number} Number of the last submitted block.
   */
  async getCurrentBlock () {
    const nextBlockNumber = await this.getNextBlock()
    return nextBlockNumber - 1
  }

  /**
   * @return {string} Address of the current operator.
   */
  async getOperator () {
    return this.contract.methods.operator().call()
  }

  /**
   * Returns the address for a given token ID.
   * @param {string} token The token ID.
   * @return {string} Address of the contract for that token.
   */
  async getTokenAddress (token) {
    if (this.web3.utils.isAddress(token)) {
      return token
    }
    return this.contract.methods['listings__contractAddress'](
      token.toString()
    ).call()
  }

  /**
   * Lists a token with the given address
   * so that it can be deposited.
   * @param {string} tokenAddress Address of the token.
   * @return {EthereumTransaction} The Ethereum transaction result.
   */
  async listToken (tokenAddress) {
    const operator = await this.getOperator()
    await this.checkAccountUnlocked(operator)

    return this.contract.methods.listToken(tokenAddress, 0).send({
      from: operator,
      gas: 6000000 // TODO: How much should this be?
    })
  }

  /**
   * Gets the current challenge period.
   * Challenge period is returned in number of blocks.
   * @return {number} Current challenge period.
   */
  async getChallengePeriod () {
    return this.contract.methods['CHALLENGE_PERIOD']().call()
  }

  /**
   * Gets the token ID for a specific token.
   * Token IDs are unique to each plasma chain.
   * TODO: Add link that explains how token IDs work.
   * @param {string} tokenAddress Token contract address.
   * @return {string} ID of that token.
   */
  async getTokenId (tokenAddress) {
    return this.contract.methods.listed(tokenAddress).call()
  }

  /**
   * Checks whether a specific deposit actually exists.
   * @param {Deposit} deposit Deposit to check.
   * @return {boolean} `true` if the deposit exists, `false` otherwise.
   */
  async depositValid (deposit) {
    // Find past deposit events.
    const depositEvents = await this.contract.getPastEvents('DepositEvent', {
      filter: {
        depositer: deposit.owner
        // block: deposit.block
      },
      fromBlock: 0
    })

    // Check that one of the events matches this deposit.
    return depositEvents.some((event) => {
      const casted = new DepositEvent(event)
      return (
        casted.owner === deposit.owner &&
        casted.start.eq(deposit.start) &&
        casted.end.eq(deposit.end) &&
        casted.token.eq(deposit.token)
      )
    })
  }

  /**
   * Submits a deposit for a user.
   * This method will pipe the `deposit` call to the correct
   * ERC20 or ETH call.
   * @param {BigNum} token Token to deposit, specified by ID.
   * @param {BigNum} amount Amount to deposit.
   * @param {string} owner Address of the user to deposit for.
   * @return {EthereumTransaction} Deposit transaction receipt.
   */
  async deposit (token, amount, owner) {
    if (!this.hasAddress) {
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

  /**
   * Deposits an amount of ETH for a user.
   * @param {BigNum} amount Amount to deposit.
   * @param {string} owner Address of the user to deposit for.
   * @return {EthereumTransaction} Deposit transaction receipt.
   */
  async depositETH (amount, owner) {
    return this.contract.methods.depositETH().send({
      from: owner,
      value: amount,
      gas: 6000000 // TODO: Figure out how much this should be.
    })
  }

  /**
   * Deposits an amount of an ERC20 for a user.
   * @param {BigNum} amount Amount to deposit.
   * @param {string} owner Address of the user to deposit for.
   * @return {EthereumTransaction} Deposit transaction receipt.
   */
  async depositERC20 (token, amount, owner) {
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

  /**
   * Starts an exit for a user.
   * Exits can only be started on *transfers*, meaning you
   * need to specify the block in which the transfer was received.
   * TODO: Add link that explains this in more detail.
   * @param {BigNum} block Block in which the transfer was received.
   * @param {BigNum} token Token to be exited.
   * @param {BigNum} start Start of the range received in the transfer.
   * @param {BigNum} end End of the range received in the transfer.
   * @return {EthereumTransaction} Exit transaction receipt.
   */
  async startExit (block, token, start, end, owner) {
    await this.checkAccountUnlocked(owner)
    return this.contract.methods.beginExit(token, block, start, end).send({
      from: owner,
      gas: 1000000
    })
  }

  /**
   * Finalizes an exit for a user.
   * @param {string} exitId ID of the exit to finalize.
   * @param {BigNum} exitableEnd Weird quirk in how we handle exits. TODO: Explain.
   * @param {string} owner Address that owns this exit.
   * @return {EthereumTransaction} Finalization transaction receipt.
   */
  async finalizeExit (exitId, exitableEnd, owner) {
    await this.checkAccountUnlocked(owner)
    return this.contract.methods.finalizeExit(exitId, exitableEnd).send({
      from: owner,
      gas: 6000000
    })
  }

  /**
   * Submits a block with the given hash.
   * Will only work if the operator's account is unlocked and
   * available to the node.
   * @param {string} hash Hash of the block to submit.
   * @return {EthereumTransaction} Block submission transaction receipt.
   */
  async submitBlock (hash) {
    // TODO: Rewrite when we add generic signature support.
    const operator = await this.getOperator()
    await this.checkAccountUnlocked(operator)
    return this.contract.methods.submitBlock(hash).send({
      from: operator
    })
  }
}

module.exports = ContractProvider
