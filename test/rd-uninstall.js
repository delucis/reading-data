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
    EXPECT(READING_DATA.plugins()).to.have.lengthOf(3)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall()
    EXPECT(READING_DATA.plugins()).to.have.lengthOf(0)
    EXPECT(READING_DATA.config.plugins).to.be.empty
  })

  IT('should remove a specific plugin', function () {
    let testPlugin1 = { someData: 'my 1st plugin' }
    let testPlugin2 = { someData: 'my 2nd plugin' }
    let testPlugin3 = { someData: 'my 3rd plugin' }
    READING_DATA.use(testPlugin1)
               .use(testPlugin2)
               .use(testPlugin3)
    EXPECT(READING_DATA.plugins()).to.have.lengthOf(3)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall(testPlugin1)
    EXPECT(READING_DATA.plugins()).to.have.lengthOf(2)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall(testPlugin2)
    EXPECT(READING_DATA.plugins()).to.have.lengthOf(1)
    EXPECT(READING_DATA.config.plugins).to.not.be.empty
    READING_DATA.uninstall(testPlugin3)
    EXPECT(READING_DATA.plugins()).to.have.lengthOf(0)
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
