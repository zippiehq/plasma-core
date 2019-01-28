const BigNum = require('bn.js')
const BaseContractProvider = require('./base-provider')
const plasmaChainCompiled = require('plasma-contracts').plasmaChainCompiled

// TODO: Rename this.
class HttpContractProvider extends BaseContractProvider {
  async start () {
    this.started = true
    this.initContract()
    this.services.eventWatcher.subscribe('DepositEvent', (event) => {
      const values = event.returnValues
      this.emitContractEvent('Deposit', {
        owner: values.depositer,
        start: new BigNum(values.untypedStart, 10),
        end: new BigNum(values.untypedEnd, 10),
        token: new BigNum(values.tokenType, 10)
      })
    })
  }

  async stop () {
    this.started = false
    this.removeAllListeners()
  }

  initContract () {
    if (this.contract) return
    this.contract = new this.services.web3.eth.Contract(plasmaChainCompiled.abi)
  }

  // TODO: Fix this for ERC20 support.
  async deposit (token, amount, owner) {
    amount = new BigNum(amount, 'hex')
    console.log(amount)
    return this.contract.methods.depositETH().send({
      from: owner,
      value: amount,
      gas: 6000000 // TODO: Figure out how much this should be.
    })
  }

  // TODO: Rewrite when we add generic signature support.
  async submitBlock (hash) {
    return this.contract.methods.submitBlock(hash).send({
      from: await this.getOperator()
    })
  }

  async depositValid (deposit) {
    return true
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
}

module.exports = HttpContractProvider
