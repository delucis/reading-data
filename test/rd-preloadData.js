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
