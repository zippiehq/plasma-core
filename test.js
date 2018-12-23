const PlasmaApp = require('./src/plasma-app')

const plasma = new PlasmaApp({
  db: 'ephem'
})

const test = async () => {
  await plasma.dbService.set('test', 123)
  let val = await plasma.dbService.get('test')
  console.log(val)
}

test()
