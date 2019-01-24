const chai = require('chai')
const rimraf = require('rimraf')

chai.should()

const LevelDBProvider = require('../../../../src/services/db/level-provider')

const TEST_DB_PATH = './.level_test'

describe('LevelDBProvider', async () => {
  let db

  beforeEach(async () => {
    // Kill and reset the database.
    rimraf.sync(TEST_DB_PATH)
    db = new LevelDBProvider({ path: TEST_DB_PATH })
  })

  afterEach(async () => {
    // Close the database.
    await db.stop()
  })

  it('should add a new item to the database', async () => {
    const expected = 'value'
    await db.set('key', expected)
    const value = await db.get('key')

    value.should.equal(expected)
  })

  it('should remove an item from the database', async () => {
    const expected = 'value'
    await db.set('key', expected)
    await db.delete('key')

    await db.get('key').should.be.rejectedWith('Key not found in database')
  })

  it('should return a fallback if a key does not exist', async () => {
    const value = await db.get('key', 'fallback')

    value.should.equal('fallback')
  })

  it('should check if an item exists', async () => {
    const expected = 'value'
    await db.set('key', expected)
    const exists = await db.exists('key')

    exists.should.be.true
  })

  it('should have a key not exist if it was removed', async () => {
    const expected = 'value'
    await db.set('key', expected)
    await db.delete('key')
    const exists = await db.exists('key')

    exists.should.be.false
  })
})
