const MAX_BLOCK_NUMBER = 2 ** 63 - 1

class Chain {
  constructor (db) {
    this.db = db
  }

  addTransaction (transaction) {
    throw Error('Not implemented')
  }

  addBlock (block) {
    throw Error('Not implemented')
  }

  getTransaction (hash) {
    throw Error('Not implemented')
  }

  getBlock (number) {
    // TODO: Figure out block encoding & decode it here
    const block = this.db.get(`block:${number}`)
    return block
  }

  getBlocks (from = 0, to = MAX_BLOCK_NUMBER) {
    let chain = []
    for (let i = from; i < to; i++) {
      let block = this.getBlock(i)
      if (!block) {
        return chain
      }
      chain.push(block)
    }
  }
}

module.exports = Chain
