const Plasma = require('./src/plasma')
const providers = require('./src/services/index')

Plasma.providers = providers
module.exports = Plasma
