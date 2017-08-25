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
    EXPECT(READING_DATA.config().preload).to.be.true
    READING_DATA.run()
    EXPECT(READING_DATA.config().preload).to.be.false
  })

  IT('should call a plugin’s data method', async function () {
    let pluginScope = 'fetchTester'
    let testValue = 'This data has been added successfully!'
    let testPlugin = {
      data: function () {
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

  IT('should call a plugin’s data method for every scope if config.scope is an array', async function () {
    let pluginScope = ['multiScope', 'manyScope', 'muchScope']
    let testValue = 'This data has been added successfully!'
    let testPlugin = {
      data: function () {
        return testValue
      },
      config: {
        scope: pluginScope
      }
    }
    READING_DATA.use(testPlugin)
    for (let scope of pluginScope) {
      EXPECT(READING_DATA.data).not.to.have.property(scope)
    }
    await READING_DATA.run()
    for (let scope of pluginScope) {
      EXPECT(READING_DATA.data).to.have.property(scope)
      EXPECT(READING_DATA.data[scope]).to.equal(testValue)
    }
  })

  IT('should call a plugin’s data method via the process hook', async function () {
    let pluginScope = 'processTester'
    let testValue = 500
    let testMultiplier = 2
    let fetchPlugin = {
      data: function () {
        return testValue
      },
      config: {
        scope: pluginScope
      }
    }
    let processPlugin = {
      data: function ({data}) {
        return data * testMultiplier
      },
      config: {
        scope: pluginScope,
        hooks: 'process'
      }
    }
    READING_DATA.use(fetchPlugin)
    READING_DATA.use(processPlugin)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(pluginScope)
    EXPECT(READING_DATA.data[pluginScope]).to.equal(testValue * testMultiplier)
  })

  IT('should call a plugin’s data method if config.hooks is an object', async function () {
    let pluginScope = 'hooksObjectTester'
    let testValue = 'This data has been added successfully!'
    let testPlugin = {
      data: function () {
        return testValue
      },
      config: {
        scope: pluginScope,
        hooks: { [pluginScope]: 'fetch' }
      }
    }
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(pluginScope)
    EXPECT(READING_DATA.data[pluginScope]).to.equal(testValue)
  })

  IT('should call a plugin’s data method if config.hooks sets a default value', async function () {
    let pluginScope = 'hooksDefaultTester'
    let testValue = 'This data has been added successfully!'
    let testPlugin = {
      data: function () {
        return testValue
      },
      config: {
        scope: pluginScope,
        hooks: { default: 'fetch' }
      }
    }
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property(pluginScope)
    EXPECT(READING_DATA.data[pluginScope]).to.equal(testValue)
  })

  IT('should not call a plugin’s data method if config.hooks doesn’t include its scope', async function () {
    let pluginScope = 'hooksMissingTester'
    let testValue = 'This data has been added successfully!'
    let testPlugin = {
      data: function () {
        return testValue
      },
      config: {
        scope: pluginScope,
        hooks: { otherScope: 'fetch' }
      }
    }
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
  })

  IT('should not call a plugin’s data method if config.hooks is invalid (is a number)', async function () {
    let pluginScope = 'hooksMissingTester'
    let testValue = 'This data has been added successfully!'
    let testPlugin = {
      data: function () {
        return testValue
      },
      config: {
        scope: pluginScope,
        hooks: 5
      }
    }
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
    await READING_DATA.run()
    EXPECT(READING_DATA.data).not.to.have.property(pluginScope)
  })

  IT('should work with an asynchronous fetch plugin (50ms timeout)', async function () {
    let testScope = 'asyncTestPlugin'
    let testPlugin = {
      config: {
        scope: testScope
      },
      data: function () {
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
    let fetchPlugin = {
      config: {
        scope: testScope
      },
      data: function () {
        return { valToSquare: testValue }
      }
    }
    let processPlugin = {
      config: {
        scope: testScope,
        hooks: 'process'
      },
      data: function ({config}, {data}) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            let d = data[config.scope]
            d.valToSquare *= d.valToSquare
            resolve(d)
          }, 75)
        })
      }
    }
    READING_DATA.use(fetchPlugin)
    READING_DATA.use(processPlugin)
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
      data: function () {
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
