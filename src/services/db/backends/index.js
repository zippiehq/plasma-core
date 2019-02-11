const EphemDBProvider = require('./ephem-provider')
// const LevelDBProvider = require('./level-provider')

module.exports = {
  EphemDBProvider,
  //  LevelDBProvider,
  DefaultDBProvider: EphemDBProvider
}
