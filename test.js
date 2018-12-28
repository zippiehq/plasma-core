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

/*
const checkValidHistoryChunk = (block, chunk) => {
  const blockHash = getBlock(block).hash
  return utils.proofs.checkMerkleSumProof(blockHash, chunk.transaction, chunk.proof)
}
*/

const checkHistory = (range, history) => {
  // TODO: Also check that start and end are within bounds
  if (range.end <= range.start) {
    throw new Error('Invalid range')
  }
  for (let chunks of history) {
    checkX(range, chunks)
  }
}

const blocks = {
  0: {
    root: ''
  }
}

const history = [
  [
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
]

const range = {
  start: 0,
  end: 51
}
let v = checkHistory(range, history)
console.log(v)
