const PlasmaApp = require('./src/plasma-app')

const plasma = new PlasmaApp({
  dbBackend: 'ephem',
  rpcPort: '9898'
})

const test = async () => {
  await plasma.services.db.set('test', 123)
  let val = await plasma.services.db.get('test')
  console.log(val)

  plasma.services.rpcServer.start()
  plasma.services.jsonrpc.subdispatchers.forEach(element => {
    console.log(element.getMethods())
  })
}

test()
