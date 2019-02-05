const BaseService = require('./base-service')
const GuardService = require('./guard-service')
const SyncService = require('./sync-service')
const ChainService = require('./chain/chain-service')
const DBProviders = require('./db/index')
const ContractProviders = require('./contract/index')
const JSONRPCService = require('./jsonrpc/jsonrpc-service')
const OperatorProviders = require('./operator/index')
const ProofService = require('./proof/proof-service')
const WalletProviders = require('./wallet/index')
const Web3Provider = require('./web3-provider')
const EventWatcherService = require('./event-watcher')

module.exports = {
  BaseService,
  GuardService,
  SyncService,
  ChainService,
  DBProviders,
  ContractProviders,
  JSONRPCService,
  OperatorProviders,
  ProofService,
  WalletProviders,
  Web3Provider,
  EventWatcherService
}
