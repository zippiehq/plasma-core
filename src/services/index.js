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
// Should this address value perhaps be kept in a seperate file?
const defaultRegistryAddress = '0xA1f90e4933F9AF055e4a309DB54316552E7Fd10c'

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
  defaultRegistryAddress
}
