const os = require('os')
const fs = require('fs')
const path = require('path')

const createIfNotExists = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  }
}

const BASE_DB_PATHS = {
  linux: `${os.homedir()}/.local/share/io.plasma.group/`,
  darwin: `${os.homedir()}/Library/Application Support/io.plasma.group/`,
  win32: '%APPDATA%\\io.plasma.group\\'
}
const BASE_DB_PATH = BASE_DB_PATHS[os.platform()]

const CHAIN_DIR = path.join(BASE_DB_PATH, 'chain')
const KEYSTORE_DIR = path.join(BASE_DB_PATH, 'keys')

module.exports = {
  CHAIN_DIR,
  KEYSTORE_DIR,
  createIfNotExists
}
