const PlasmaApp = require('./src/plasma-app')

const plasma = new PlasmaApp({
  db: 'ephem'
})

const test = async () => {
  await plasma.services.db.set('test', 123)
  let val = await plasma.services.db.get('test')
  console.log(val)
}

test()
