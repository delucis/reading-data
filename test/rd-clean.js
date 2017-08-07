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
