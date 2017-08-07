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
