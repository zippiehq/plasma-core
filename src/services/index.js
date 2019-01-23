const BaseService = require('./base-service')
const GuardService = require('./guard-service')
const SyncService = require('./sync-service')
const ChainService = require('./chain/chain-service')
const RangeManagerService = require('./chain/range-manager-service')
const DBProviders = require('./db/index')
const ContractProviders = require('./contract/index')
const JSONRPCService = require('./jsonrpc/jsonrpc-service')
const OperatorProviders = require('./operator/index')
const ProofService = require('./proof/proof-service')
const WalletProviders = require('./wallet/index')

module.exports = {
  BaseService,
  GuardService,
  SyncService,
  ChainService,
  RangeManagerService,
  DBProviders,
  ContractProviders,
  JSONRPCService,
  OperatorProviders,
  ProofService,
  WalletProviders
}
