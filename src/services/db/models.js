const BigNum = require('bn.js')

class Exit {
  constructor (args) {
    this.id = args.id
    this.token = new BigNum(args.token, 'hex')
    this.start = new BigNum(args.start, 'hex')
    this.end = new BigNum(args.end, 'hex')
    this.block = new BigNum(args.block, 'hex')
    this.exiter = args.exiter
  }
}

class Deposit {
  constructor (args) {
    this.token = new BigNum(args.token, 'hex')
    this.start = new BigNum(args.start, 'hex')
    this.end = new BigNum(args.end, 'hex')
    this.block = new BigNum(args.block, 'hex')
    this.depositer = args.depositer
  }
}

module.exports = {
  Exit,
  Deposit
}
