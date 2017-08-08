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

DESCRIBE('ReadingData#hooks()', function () {
  IT('should be a function', function () {
    EXPECT(READING_DATA.hooks).to.be.a('function')
  })

  IT('should return an array of strings', function () {
    let hooks = READING_DATA.hooks()
    EXPECT(hooks).to.be.an('array')
    for (let hook of hooks) {
      EXPECT(hook).to.be.a('string')
    }
  })
})
