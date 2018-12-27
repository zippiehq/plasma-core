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
