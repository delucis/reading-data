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

DESCRIBE('ReadingData', function () {
  IT('should be an object', function () {
    EXPECT(READING_DATA).to.be.an('object')
  })
})

DESCRIBE('ReadingData#config', function () {
  IT('should exist', function () {
    EXPECT(READING_DATA).to.have.property('config')
  })

  IT('should be an object', function () {
    EXPECT(READING_DATA.config).to.be.an('object')
  })
})

DESCRIBE('ReadingData#data', function () {
  IT('should exist', function () {
    EXPECT(READING_DATA).to.have.property('data')
  })

  IT('should be an object', function () {
    EXPECT(READING_DATA.data).to.be.an('object')
  })
})

DESCRIBE('ReadingData#plugins', function () {
  IT('should exist', function () {
    EXPECT(READING_DATA).to.have.property('plugins')
  })

  IT('should be an array', function () {
    EXPECT(READING_DATA.plugins).to.be.an('array')
  })
})

DESCRIBE('ReadingData#clean()', function () {
  IT('should be a function', function () {
    EXPECT(READING_DATA.clean).to.be.a('function')
  })

  IT('should return the ReadingData instance', function () {
    EXPECT(READING_DATA.clean()).to.be.an('object')
    EXPECT(READING_DATA.clean()).to.equal(READING_DATA)
  })

  IT('should empty ReadingData#data if called with no arguments', function () {
    let bogusData = {
      somePlugin: { count: 5, title: 'I’m so bogus!' },
      pluginTwo: { me: 'I am a plugin too.' }
    }
    READING_DATA.preloadData(bogusData)
    READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property('somePlugin')
    EXPECT(READING_DATA.data).to.have.property('pluginTwo')
    READING_DATA.clean()
    EXPECT(READING_DATA.data).to.be.empty
  })

  IT('should remove a key from ReadingData#data if called with that key', function () {
    let bogusData = {
      somePlugin: { count: 5, title: 'I’m so bogus!' },
      pluginTwo: { me: 'I am a plugin too.' }
    }
    READING_DATA.preloadData(bogusData)
    READING_DATA.run()
    EXPECT(READING_DATA.data).to.have.property('somePlugin')
    EXPECT(READING_DATA.data).to.have.property('pluginTwo')
    READING_DATA.clean('somePlugin')
    EXPECT(READING_DATA.data).to.not.have.property('somePlugin')
    EXPECT(READING_DATA.data).to.have.property('pluginTwo')
  })

  IT('should do nothing if called with a key not in ReadingData#data', function () {
    let bogusData = {
      somePlugin: { count: 5, title: 'I’m so bogus!' },
      pluginTwo: { me: 'I am a plugin too.' }
    }
    READING_DATA.preloadData(bogusData)
    READING_DATA.run()
    let preCleanData = READING_DATA.data
    READING_DATA.clean('someOtherScope')
    EXPECT(READING_DATA.data).to.equal(preCleanData)
  })

  IT('should throw an error if argument isn’t a string', function () {
    try {
      READING_DATA.clean({ obj: 'What’s an object doing here?!' })
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })
})

DESCRIBE('ReadingData#preloadData()', function () {
  IT('should be a function', function () {
    EXPECT(READING_DATA.preloadData).to.be.a('function')
  })

  IT('should set #config.preload to true', function () {
    READING_DATA.preloadData({})
    EXPECT(READING_DATA.config.preload).to.be.true
  })

  IT('should set #config.preloadData to given value', function () {
    let testData = { testService: [], testServiceTwo: [ 'somedata' ] }
    READING_DATA.preloadData(testData)
    EXPECT(READING_DATA.config.preloadData).to.equal(testData)
  })

  IT('should be able to set #config.preload without altering #config.preloadData', function () {
    let testData = READING_DATA.config.preloadData
    READING_DATA.preloadData(false)
    EXPECT(READING_DATA.config.preloadData).to.equal(testData)
    EXPECT(READING_DATA.config.preload).to.be.false
    READING_DATA.preloadData(true)
    EXPECT(READING_DATA.config.preloadData).to.equal(testData)
    EXPECT(READING_DATA.config.preload).to.be.true
  })

  IT('should not accept a string as its argument', function () {
    try {
      READING_DATA.preloadData('foo')
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })
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

DESCRIBE('ReadingData#uninstall()', function () {
  IT('should be a function', function () {
    EXPECT(READING_DATA.uninstall).to.be.a('function')
  })

  IT('should remove all installed plugins', function () {
    let testPlugin1 = { someData: 'my 1st plugin' }
    let testPlugin2 = { someData: 'my 2nd plugin' }
    let testPlugin3 = { someData: 'my 3rd plugin' }
    READING_DATA.use(testPlugin1)
               .use(testPlugin2)
               .use(testPlugin3)
    EXPECT(READING_DATA.plugins).to.have.lengthOf(3)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall()
    EXPECT(READING_DATA.plugins).to.have.lengthOf(0)
    EXPECT(READING_DATA.config.plugins).to.be.empty
  })

  IT('should remove a specific plugin', function () {
    let testPlugin1 = { someData: 'my 1st plugin' }
    let testPlugin2 = { someData: 'my 2nd plugin' }
    let testPlugin3 = { someData: 'my 3rd plugin' }
    READING_DATA.use(testPlugin1)
               .use(testPlugin2)
               .use(testPlugin3)
    EXPECT(READING_DATA.plugins).to.have.lengthOf(3)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall(testPlugin1)
    EXPECT(READING_DATA.plugins).to.have.lengthOf(2)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall(testPlugin2)
    EXPECT(READING_DATA.plugins).to.have.lengthOf(1)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall(testPlugin3)
    EXPECT(READING_DATA.plugins).to.have.lengthOf(0)
    EXPECT(READING_DATA.config.plugins).to.be.empty
  })

  IT('should throw an error if the plugin isn’t installed', function () {
    let testPlugin = { someData: 'my 1st plugin' }
    try {
      READING_DATA.uninstall(testPlugin)
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })
})

DESCRIBE('ReadingData#use()', function () {
  IT('should be a function', function () {
    EXPECT(READING_DATA.use).to.be.a('function')
  })

  IT('should add a plugin to ReadingData#plugins', function () {
    let testPlugin = { usingAPlugin: 'should add it to the plugins member' }
    let currentPluginCount = READING_DATA.plugins.length
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.plugins).to.have.lengthOf(currentPluginCount + 1)
  })

  IT('should add a unique ID to the installed plugin', function () {
    let testPlugin = { usingAPlugin: 'should assign it a unique ID' }
    READING_DATA.use(testPlugin)
    let indexOfNewPlugin = READING_DATA.plugins.length - 1
    let newPlugin = READING_DATA.plugins[indexOfNewPlugin]
    EXPECT(newPlugin).to.have.property('__id__')
    EXPECT(newPlugin.__id__).to.be.a('number')
  })

  IT('should add a second argument to the installed plugin’s config property', function () {
    let testPlugin = { usingAPlugin: 'should accept a second options argument' }
    let testOpts = { testPluginConfig: 'should be welcome' }
    READING_DATA.use(testPlugin, testOpts)
    let indexOfNewPlugin = READING_DATA.plugins.length - 1
    let newPlugin = READING_DATA.plugins[indexOfNewPlugin]
    EXPECT(newPlugin).to.have.property('config')
    EXPECT(newPlugin.config).to.include(testOpts)
  })

  IT('should create an entry in ReadingData#config.plugins', function () {
    let testPlugin = { usingAPlugin: 'should add a config entry' }
    let testOpts = { testPluginConfig: 'should be added to global config' }
    READING_DATA.use(testPlugin, testOpts)
    let indexOfNewPlugin = READING_DATA.plugins.length - 1
    let newPlugin = READING_DATA.plugins[indexOfNewPlugin]
    EXPECT(READING_DATA.config.plugins).to.have.property(newPlugin.__id__)
    EXPECT(READING_DATA.config.plugins[newPlugin.__id__]).to.include(testOpts)
  })

  IT('should only install a plugin once', function () {
    let testPlugin = { usingAPlugin: 'should only be possible once' }
    READING_DATA.use(testPlugin)
    let pluginCount = READING_DATA.plugins.length
    READING_DATA.use(testPlugin)
    EXPECT(READING_DATA.plugins.length).to.equal(pluginCount)
  })

  IT('shouldn’t install a plugin that is a string', function () {
    let testPlugin = 'i’m not really a plugin'
    try {
      READING_DATA.use(testPlugin)
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })
})
