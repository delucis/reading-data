'use strict'

const DESCRIBE = require('mocha').describe
const BEFORE_EACH = require('mocha').beforeEach
const IT = require('mocha').it
const EXPECT = require('chai').expect
const READING_DATA = require('../index')

BEFORE_EACH(function () {
  READING_DATA.clean()
  READING_DATA.uninstall()
})

DESCRIBE('ReadingData#run()', function () {
  IT('should be a function', function () {
    EXPECT(READING_DATA.run).to.be.a('function')
  })

  IT('should return an object', async function () {
    EXPECT(await READING_DATA.run()).to.be.an('object')
  })

  IT('should preload data if ReadingData#config.preload is true', function () {
    let dummyData = { data: 'this data should be loaded' }
    READING_DATA.clean()
    READING_DATA.preloadData(dummyData)
    EXPECT(READING_DATA.data).to.be.empty
    READING_DATA.run()
    EXPECT(READING_DATA.data).to.include(dummyData)
  })

  IT('should not preload data if ReadingData#config.preload is false', function () {
    READING_DATA.clean()
    READING_DATA.preloadData({ data: 'this data should not be loaded' })
    READING_DATA.preloadData(false)
    EXPECT(READING_DATA.data).to.be.empty
    READING_DATA.run()
    EXPECT(READING_DATA.data).to.be.empty
  })

  IT('should set ReadingData#config.preload to false after preloading', function () {
    let dummyData = { data: 'this data should be loaded' }
    READING_DATA.clean()
    READING_DATA.preloadData(dummyData)
    EXPECT(READING_DATA.config.preload).to.be.true
    READING_DATA.run()
    EXPECT(READING_DATA.config.preload).to.be.false
  })

  IT('should call a plugin’s fetch method', async function () {
    let pluginScope = 'fetchTester'
    let testValue = 'This data has been added successfully!'
    let testPlugin = {
      fetch: function () {
        return testValue
      },
      config: {
        scope: pluginScope
      }
    }
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(pluginScope)
    EXPECT(READING_DATA.data[pluginScope]).to.equal(testValue)
  })

  IT('should add a plugin’s fetch property to data if it’s an object', function () {
    let pluginScope = 'fetchObjTester'
    let testValue = { data: 'some data returned immediately as an object' }
    let testPlugin = {
      fetch: testValue,
      config: {
        scope: pluginScope
      }
    }
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
    READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(pluginScope)
    EXPECT(READING_DATA.data[pluginScope]).to.equal(testValue)
  })

  IT('should do nothing if a plugin’s fetch property is a string', function () {
    let pluginScope = 'fetchStringTester'
    let testPlugin = {
      fetch: 'fetch shouldn’t be a string, so this should be ignored',
      config: {
        scope: pluginScope
      }
    }
    READING_DATA.use(testPlugin)
    let preRunData = READING_DATA.data
    READING_DATA.run()
    EXPECT(READING_DATA.data).to.equal(preRunData)
  })

  IT('should do nothing if a plugin doesn’t have a fetch property', function () {
    let pluginScope = 'noFetchTester'
    let testPlugin = {
      fudge: 'definitely not a fetch function',
      config: {
        scope: pluginScope
      }
    }
    READING_DATA.use(testPlugin)
    let preRunData = READING_DATA.data
    READING_DATA.run()
    EXPECT(READING_DATA.data).to.equal(preRunData)
  })

  IT('should call a plugin’s process method', async function () {
    let pluginScope = 'processTester'
    let testValue = 500
    let testMultiplier = 2
    let testPlugin = {
      fetch: function () {
        return testValue
      },
      process: function ({config}, {data}) {
        return data[config.scope] * testMultiplier
      },
      config: {
        scope: pluginScope
      }
    }
    READING_DATA.use(testPlugin)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(pluginScope)
    EXPECT(READING_DATA.data[pluginScope]).to.equal(testValue * testMultiplier)
  })

  IT('should work with an asynchronous fetch plugin (50ms timeout)', async function () {
    let testScope = 'asyncTestPlugin'
    let testPlugin = {
      config: {
        scope: testScope
      },
      fetch: function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            resolve('some async data')
          }, 50)
        })
      }
    }
    READING_DATA.use(testPlugin)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(testScope)
  })

  IT('should work with an asynchronous process plugin (75ms timeout)', async function () {
    let testScope = 'asyncProcessTestPlugin'
    let testValue = 12
    let testPlugin = {
      config: {
        scope: testScope
      },
      fetch: {
        valToSquare: testValue
      },
      process: function ({config}, {data}) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            let d = data[config.scope]
            d.valToSquare *= d.valToSquare
            resolve(d)
          }, 75)
        })
      }
    }
    READING_DATA.use(testPlugin)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(testScope)
    EXPECT(READING_DATA.data[testScope].valToSquare).to.equal(testValue * testValue)
  })

  IT('should work with Promise-style syntax', function () {
    let testScope = 'promiseTestPlugin'
    let testPlugin = {
      config: {
        scope: testScope
      },
      fetch: function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            resolve('some async data')
          }, 50)
        })
      }
    }
    READING_DATA.use(testPlugin)
    return READING_DATA.run().then((rd) => {
      EXPECT(rd.data).to.have.property(testScope)
    })
  })
})