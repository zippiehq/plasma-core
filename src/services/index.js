const BaseService = require('./base-service')
const GuardService = require('./guard-service')
const SyncService = require('./sync-service')
const ChainService = require('./chain/chain-service')
const ChainDB = require('./db/chain-db')
const SyncDB = require('./db/sync-db')
const DBProviders = require('./db/backends/index')
const ContractProviders = require('./contract/index')
const JSONRPCService = require('./jsonrpc/jsonrpc-service')
const OperatorProviders = require('./operator/index')
const ProofService = require('./chain/proof-service')
const WalletProviders = require('./wallet/index')
const Web3Provider = require('./web3-provider')
const EventHandler = require('./contract/events/event-handler')
const EventWatcher = require('./contract/events/event-watcher')

const BaseDBProvider = require('./db/backends/base-provider')
const BaseWalletProvider = require('./wallet/base-provider')

const base = {
  BaseDBProvider,
  BaseWalletProvider
}

module.exports = {
  BaseService,
  GuardService,
  SyncService,
  ChainService,
  ChainDB,
  SyncDB,
  DBProviders,
  ContractProviders,
  JSONRPCService,
  OperatorProviders,
  ProofService,
  WalletProviders,
  Web3Provider,
  EventHandler,
  EventWatcher,
  base
}
