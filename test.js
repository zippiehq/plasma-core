const PlasmaApp = require('./src/plasma-app')

const plasma = new PlasmaApp({
  dbBackend: 'ephem',
  rpcPort: '9898',
  contract: {
    abi: '',
    address: '0x0'
  }
})

const test = async () => {
  await plasma.services.db.set('test', 123)
  let val = await plasma.services.db.get('test')
  console.log(val)

  const methods = plasma.services.jsonrpc.getMethods()
  console.log(methods)
}

test()

/*
const getBlock = (number) => {
  return ''
}
*/

const checkDepositsValid = (deposits, range) => {
  // TODO: Check that the deposits are included in the specified blocks.
}

const getRequiredRanges = (deposits) => {
  const sortedDeposits = deposits.sort((a, b) => {
    return a.start - b.start
  })
  const firstDeposit = sortedDeposits[0]

  let requiredRanges = {}
  for (let deposit of deposits) {
    requiredRanges[deposit.block] = {
      start: firstDeposit.start,
      end: deposit.end
    }
  }

  return requiredRanges
}

const checkChunksTouch = (chunks) => {
  return chunks.every((chunk, i) => {
    return i === 0 || chunk.tx.start === chunks[i - 1].tx.end + 1
  })
}

const checkX = (range, chunks) => {
  const sortedChunks = chunks.sort((a, b) => {
    return a.tx.start - b.tx.start
  })

  const firstChunk = sortedChunks[0]
  const lastChunk = sortedChunks[sortedChunks.length - 1]
  const coversRange = range.start >= firstChunk.tx.start && range.end <= lastChunk.tx.end && checkChunksTouch(sortedChunks)
  if (!coversRange) {
    throw new Error('History chunks do not cover entire range')
  }
}

const checkValidHistoryChunk = (block, chunk) => {
  /*
  const blockHash = getBlock(block).hash
  return utils.proofs.checkMerkleSumProof(blockHash, chunk.transaction, chunk.proof)
  */
  return true
}

const nextLowerValue = (obj, x) => {
  x = parseInt(x)

  let lowest = -1
  for (let key in obj) {
    key = parseInt(key)
    if (key > lowest && key <= x) {
      lowest = key
    }
  }
  return obj[lowest]
}

const checkHistory = (transaction, range, deposits, history) => {
  // TODO: Also check that start and end are within bounds.
  if (range.end <= range.start) {
    throw new Error('Invalid range')
  }
  // TODO: Check that the history chunks are correctly formed.

  // Check that the deposits are valid for the given range.
  checkDepositsValid(deposits, range)

  // Determine where to start checking the history.
  const earliestDeposit = deposits.reduce((prev, curr) => {
    return prev.block < curr.block ? prev : curr
  })

  // Check that the ranges are all covered.
  const requiredRanges = getRequiredRanges(deposits)
  for (let i = earliestDeposit.block; i < transaction.block; i++) {
    let chunks = history[i]
    let requiredRange = nextLowerValue(requiredRanges, i)
    checkX(requiredRange, chunks)
  }

  // Check that the chunks are all valid.
  // We do this in a separate loop because it's computationally intensive.
  for (let block in history) {
    let chunks = history[block]
    for (let chunk of chunks) {
      checkValidHistoryChunk(block, chunk)
    }
  }
}

const blocks = {
  0: {
    root: ''
  }
}

const deposits = [
  {
    block: 0,
    start: 0,
    end: 50
  }
]

const history = {
  0: [
    {
      tx: {
        start: 0,
        end: 1
      },
      proof: ''
    },
    {
      tx: {
        start: 2,
        end: 50
      },
      proof: ''
    }
  ]
}

const range = {
  start: 0,
  end: 51
}

const transaction = {
  block: 1
}

checkHistory(transaction, range, deposits, history)
