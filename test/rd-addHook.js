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

DESCRIBE('ReadingData#addHook()', function () {
  IT('should be a function', function () {
    EXPECT(READING_DATA.addHook).to.be.a('function')
  })

  IT('should throw an error if first argument isn’t a string', function () {
    try {
      READING_DATA.addHook({ huh: 'this ain’t no string' })
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })

  IT('should throw an error if second argument isn’t a string', function () {
    try {
      READING_DATA.addHook('newHookWithABadPreposition', { huh: 'this ain’t no string' })
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })

  IT('should throw an error if second argument isn’t a valid string', function () {
    try {
      READING_DATA.addHook('newHookWithABadPreposition', 'above')
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })

  IT('should throw an error if third argument isn’t a string', function () {
    try {
      READING_DATA.addHook('newHookWithABadLocation', 'before', { huh: 'this ain’t no string' })
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })

  IT('should throw an error if third argument isn’t an existing hook', function () {
    try {
      READING_DATA.addHook('newHookWithABadLocation', 'before', 'nonexistentLocation')
    } catch (e) {
      EXPECT(e).to.be.an('error')
    }
  })

  IT('should add a hook when called with one argument', function () {
    let testHook = 'oneArgumentTestHook'
    READING_DATA.addHook(testHook)
    let hooks = READING_DATA.hooks()
    EXPECT(hooks[hooks.length - 1]).to.equal(testHook)
  })

  IT('should add a hook when called with two arguments (preposition: "before")', function () {
    let testHook = 'twoArgumentsTestHook-Before'
    READING_DATA.addHook(testHook, 'before')
    let hooks = READING_DATA.hooks()
    EXPECT(hooks[0]).to.equal(testHook)
  })

  IT('should add a hook when called with two arguments (preposition: "after")', function () {
    let testHook = 'twoArgumentsTestHook-After'
    READING_DATA.addHook(testHook, 'after')
    let hooks = READING_DATA.hooks()
    EXPECT(hooks[hooks.length - 1]).to.equal(testHook)
  })

  IT('should add a hook when called with three arguments (preposition: "before")', function () {
    let testHook = 'threeArgumentsTestHook-Before'
    READING_DATA.addHook(testHook, 'before', 'process')
    let hooks = READING_DATA.hooks()
    EXPECT(hooks[hooks.indexOf('process') - 1]).to.equal(testHook)
  })

  IT('should add a hook when called with three arguments (preposition: "after")', function () {
    let testHook = 'threeArgumentsTestHook-After'
    READING_DATA.addHook(testHook, 'after', 'process')
    let hooks = READING_DATA.hooks()
    EXPECT(hooks[hooks.indexOf('process') + 1]).to.equal(testHook)
  })

  IT('should not add a hook that is already registered', function () {
    let hook = 'process'
    let hooks = READING_DATA.hooks()
    EXPECT(hooks).to.include(hook)
    let hookIndex = hooks.indexOf(hook)
    READING_DATA.addHook(hook)
    hooks = READING_DATA.hooks()
    EXPECT(hooks.indexOf(hook)).to.equal(hookIndex)
  })
})
