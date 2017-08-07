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

DESCRIBE('ReadingData#plugins', function () {
  IT('should exist', function () {
    EXPECT(READING_DATA).to.have.property('plugins')
  })

  IT('should be an array', function () {
    EXPECT(READING_DATA.plugins).to.be.an('array')
  })
})
