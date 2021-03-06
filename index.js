/**
 * @module reading-data
 * @requires winston
 * @requires lodash.clonedeep
 */

const log = require('winston')
log.add(new log.transports.Console())
const CLONE = require('lodash.clonedeep')
const JP = require('jsonpath')
const TIMESPAN = require('time-span')
const MS = require('pretty-ms')

const ReadingData = (function () {
  // PRIVATE VARIABLES
  /**
   * Object containing default configuration.
   *
   * @memberof module:reading-data
   * @private
   * @type {Object}
   * @prop {Object}  plugins={}     - Holds configuration for installed plugins.
   * @prop {Boolean} preload=false  - Enables/disables preloading of data.
   * @prop {Object}  preloadData={} - Holds data to be preloaded.
   */
  let config = {
    plugins: {},
    preload: false,
    preloadData: {}
  }

  /**
   * Array holding the hooks called during [.run()]{@link module:reading-data~run}.
   *
   * @memberof module:reading-data
   * @private
   * @type {String[]}
   *
   * @since 0.2.0
   */
  let hooks = ['preload', 'fetch', 'process']

  /**
   * Array holding the currently installed plugins.
   *
   * @memberof module:reading-data
   * @private
   * @type {Array}
   */
  let plugins = []

  /**
   * Object holding metadata about this reading-data instance
   *
   * @memberof module:reading-data
   * @private
   * @type {Object}
   *
   * @since 0.8.0
   */
  let meta = {}

  /**
   * Generate a unique ID to identify an installed plugin.
   *
   * @memberof module:reading-data
   * @private
   * @return {Number} A number which hasn’t yet been used to identify a plugin.
   */
  let generatePluginID = function () {
    if (!this.count) this.count = 0
    let id = this.count += 1
    return id
  }

  /**
   * Load [config.preloadData]{@link module:reading-data~config} into
   * [.data]{@link module:reading-data~data}.
   *
   * @memberof module:reading-data
   * @private
   * @param {Object} context
   */
  let preload = function (context) {
    if (!config.preload) {
      return
    }
    log.debug('Preloading data...')
    Object.assign(context.data, config.preloadData)
    config.preload = false
  }

  /**
   * Test whether a string starts with '$'.
   *
   * @memberof module:reading-data
   * @private
   * @param  {String} string The string to test.
   * @return {Boolean}       `true` if `string` starts with `$`, otherwise `false`.
   *
   * @since 0.7.0
   */
  let isJSONPath = function (string) {
    return /^\$/.test(string)
  }

  /**
   * Test whether or not a plugin should be called for a given hook and scope.
   *
   * @memberof module:reading-data
   * @private
   * @param  {String} hook         The hook currenty being called.
   * @param  {Object} pluginConfig The configuration object for this plugin.
   * @param  {String} scope        The scope for which the plugin is currently being called.
   * @return {Boolean}             `true` if that plugin should be called for `hook` & `scope`.
   *
   * @since 0.4.0
   */
  let shouldCall = function (hook, pluginConfig, scope) {
    if (!pluginConfig.hasOwnProperty('hooks')) {
      return hook === 'fetch'
    }
    if (typeof pluginConfig.hooks === 'string') {
      return hook === pluginConfig.hooks
    }
    if (typeof pluginConfig.hooks === 'object') {
      if (pluginConfig.hooks.hasOwnProperty(scope)) {
        return hook === pluginConfig.hooks[scope]
      }
      if (pluginConfig.hooks.hasOwnProperty('default')) {
        return hook === pluginConfig.hooks.default
      }
    }
    return false
  }

  /**
   * Call plugins’ methods, and add their returned values to
   * [.data]{@link module:reading-data~data} under the plugin’s scope.
   *
   * @memberof module:reading-data
   * @private
   * @param  {String} hook    Name of the hook to try to call on each plugin.
   * @param  {Object} context Contextual this passed from {@link module:reading-data~run}
   * @return {Object}         context.data after all plugins have returned their data.
   *
   * @since 0.2.0
   */
  let callHook = async function (hook, context) {
    await Promise.all(plugins.map(async plugin => {
      let pluginConfig = config.plugins[plugin.__id__]
      let pluginScopes = Array.isArray(pluginConfig.scope) ? pluginConfig.scope : Array.of(pluginConfig.scope)
      await Promise.all(pluginScopes.map(async scope => {
        if (shouldCall(hook, pluginConfig, scope)) {
          let pluginContext = {
            config: pluginConfig,
            scope: scope
          }
          if (isJSONPath(scope)) {
            let paths = JP.paths(context.data, scope)
            await Promise.all(paths.map(async path => {
              let pathString = JP.stringify(path)
              pluginContext.data = JP.value(context.data, pathString)
              let pluginData = await plugin.data(pluginContext, context)
              if (pathString === '$') {
                context.data = pluginData
              } else {
                JP.value(context.data, pathString, pluginData)
              }
            }))
          } else {
            pluginContext.data = context.data[scope] || {}
            let pluginData = await plugin.data(pluginContext, context)
            context.data[scope] = pluginData
          }
        }
      }))
    }))
    return context.data
  }

  /**
   * Cycle through `.hooks`, calling each hook in order.
   *
   * @memberof module:reading-data
   * @private
   * @param  {Object} context Contextual this passed from {@link module:reading-data~run}
   * @return {Object}         `context.data` after all plugins have returned their data.
   *
   * @since 0.2.0
   */
  let callHooks = async function (context) {
    for (let hook of hooks) {
      await callHook(hook, context)
    }
    return context.data
  }

  return {
    // PUBLIC VARIABLES
    /**
     * Contains the reading data currently available.
     *
     * @type {Object}
     * @since 0.0.1
     */
    data: {},

    /**
     * Get the current configuration.
     * @return {Object} An object containing the current configuration.
     *
     * @since 0.6.0
     */
    config: function () {
      return config
    },

    /**
     * Get an array of the currently installed plugins.
     * @return {Object[]} An array of the currently installed plugins.
     *
     * @since 0.5.0
     */
    plugins: function () {
      return plugins
    },

    /**
     * Get the metadata object for this instance of reading-data.
     * @return {Object} Object containing metadata about reading-data, e.g. how long `.run()` took to complete.
     *
     * @since 0.8.0
     */
    meta: function () {
      return meta
    },

    // PUBLIC FUNCTIONS
    /**
     * Adds a hook to be called during ReadingData’s
     * [.run()]{@link module:reading-data~run} cycle.
     *
     * @param  {String} hook          The name of the new hook to register.
     * @param  {String} [preposition] Either `'before'` or `'after'`.
     * @param  {String} [location]    The name of the existing hook to register the new hook before or after.
     * @return {Object} Returns [ReadingData]{@link module:reading-data} to allow for method chaining.
     *
     * @example <caption>Add a new hook after all existing hooks.</caption>
     * const RD = require('@delucis/reading-data')
     * RD.addHook('postProcess')
     *
     * @example <caption>Add a new hook before all existing hooks.</caption>
     * const RD = require('@delucis/reading-data')
     * RD.addHook('init', 'before')
     *
     * @example <caption>Add a “preProcess” hook before the existing “process” hook.</caption>
     * const RD = require('@delucis/reading-data')
     * RD.addHook('preProcess', 'before', 'process')
     *
     * @since 0.2.0
     */
    addHook: function (hook, preposition, location) {
      if (typeof hook !== 'string') {
        throw new Error('ReadingData#addHook(): first argument must be a string, was ' + typeof hook + '.')
      }
      if (hooks.indexOf(hook) >= 0) {
        log.debug('ReadingData#addHook(): "' + hook + '" is already registered.')
        return this
      }
      if (typeof preposition === 'undefined') {
        hooks.push(hook)
        return this
      }
      if (typeof preposition !== 'string') {
        throw new Error('ReadingData#addHook(): second argument must be a string, was ' + typeof preposition + '.')
      }
      if (preposition !== 'after' && preposition !== 'before') {
        throw new Error('ReadingData#addHook(): second argument must be either "after" or "before", was "' + preposition + '".')
      }
      if (typeof location === 'undefined') {
        if (preposition === 'before') {
          hooks.unshift(hook)
          return this
        } else { // preposition === 'after'
          hooks.push(hook)
          return this
        }
      }
      if (typeof location !== 'string') {
        throw new Error('ReadingData#addHook(): third argument must be a string, was ' + typeof location + '.')
      }
      let locationIndex = hooks.indexOf(location)
      if (locationIndex < 0) {
        throw new Error('ReadingData#addHook(): third argument must be the name of an existing hook.')
      }
      if (preposition === 'before') {
        hooks.splice(locationIndex, 0, hook)
      } else { // preposition === 'after'
        hooks.splice(locationIndex + 1, 0, hook)
      }
      return this
    },

    /**
     * Clean up [.data]{@link module:reading-data~data}, wiping parts or all of it.
     *
     * @param  {String} [scope] The scope to be cleaned.
     * @return {Object} Returns [ReadingData]{@link module:reading-data} to allow for method chaining.
     *
     * @example
     * const RD = require('@delucis/reading-data')
     *
     * // ... Following several .run() cycles, RD.data is cluttered
     * // ... and you want to start from a clean slate.
     *
     * console.log(RD.data) // => { plugin1Data: { ... }, preloadData: [ ... ] }
     *
     * RD.clean()
     *
     * console.log(RD.data) // => {}
     *
     * @example
     * const RD = require('@delucis/reading-data')
     *
     * // ...
     *
     * console.log(RD.data) // => { plugin1Data: { ... }, preloadData: [ ... ] }
     *
     * RD.clean('plugin1Data')
     *
     * console.log(RD.data) // => { preloadData: [ ... ] }
     *
     * @since 0.0.1
     */
    clean: function (scope) {
      if (!scope) {
        this.data = {}
        return this
      }
      if (typeof scope !== 'string') {
        throw new Error('ReadingData#clean(): expected first argument to be a string, but was ' + typeof scope + '.')
      }
      if (this.data.hasOwnProperty(scope)) {
        delete this.data[scope]
        return this
      }
      log.debug('ReadingData#clean(): passed scope not found in data; nothing cleaned.')
      return this
    },

    /**
     * Get an array of currently registered hooks.
     * @return {String[]} An array of registered hook names.
     *
     * @since 0.2.0
     */
    hooks: function () {
      return hooks
    },

    /**
     * Tell [ReadingData]{@link module:reading-data} to use a plugin.
     *
     * Adds the provided `plugin` to [.plugins]{@link module:reading-data~plugins}
     * and merges any provided `opts` with `plugin.config` before adding it to
     * [.config.plugins]{@link module:reading-data~config}.
     *
     * @param  {Object} plugin The plugin to be installed.
     * @param  {Object} [opts] Configuration parameters for the plugin.
     * @return {Object} Returns [ReadingData]{@link module:reading-data} to allow for method chaining.
     *
     * @example
     * const RD = require('@delucis/reading-data')
     * const plugin = require('helpful-reading-data-plugin')
     * const myPluginOptions = {
     *   numberOption: 5,
     *   stringOption: 'Five!'
     * }
     *
     * // Tell ReadingData instance to use the plugin.
     * RD.use(plugin, myPluginOptions)
     *
     * // Trigger ReadingData’s run() cycle, which will call all installed plugins.
     * RD.run()
     *
     * @since 0.0.1
     */
    use: function (plugin, opts) {
      if (typeof plugin !== 'object') {
        throw new Error('ReadingData#use(): first argument must be of type object, but was ' + typeof plugin + '.')
      }
      if (plugins.indexOf(plugin) > -1) {
        log.debug('ReadingData#use(): plugin already installed')
        return this
      }
      let id = generatePluginID()
      let defaultConfig = CLONE((plugin.config || {}))
      let pluginConfig = Object.assign(defaultConfig, (opts || {}))
      config.plugins[id] = pluginConfig
      plugin.__id__ = id
      plugins.push(plugin)
      return this
    },

    /**
     * Remove plugins from the [ReadingData]{@link module:reading-data} instance
     * that were installed with [.use()]{@link module:reading-data~use}.
     *
     * It will unlist plugins from [.plugins]{@link module:reading-data~plugins}
     * and remove their settings from [.config.plugins]{@link module:reading-data~config}.
     *
     * @param  {Object} [plugin] A previously installed plugin object.
     * @return {Object} Returns [ReadingData]{@link module:reading-data} to allow for method chaining.
     *
     * @example
     * const RD = require('@delucis/reading-data')
     * const plugin1 = require('unhelpful-reading-data-plugin')
     * const plugin2 = require('really-unhelpful-reading-data-plugin')
     *
     * // Tell ReadingData to use some plugins.
     * RD.use(plugin1)
     * RD.use(plugin2)
     *
     * // Remove all plugins currently added to the ReadingData instance.
     * RD.uninstall()
     *
     * @example
     * const RD = require('@delucis/reading-data')
     * const plugin1 = require('unhelpful-reading-data-plugin')
     * const plugin2 = require('helpful-reading-data-plugin')
     *
     * // Tell ReadingData to use some plugins.
     * RD.use(plugin1)
     * RD.use(plugin2)
     *
     * // Remove a specific plugin.
     * RD.uninstall(plugin1)
     *
     * @since 0.0.1
     */
    uninstall: function (plugin) {
      if (!plugin) {
        plugins.length = 0
        config.plugins = {}
        return this
      } else if (typeof plugin === 'object' && plugins.indexOf(plugin) > -1) {
        let pluginIndex = plugins.indexOf(plugin)
        let pluginID = plugins[pluginIndex].__id__
        delete config.plugins[pluginID]
        plugins.splice(pluginIndex, 1)
        return this
      } else {
        throw new Error('ReadingData#uninstall(): the first argument must be a plugin object that has already been installed')
      }
    },

    /**
     * Configure ReadingData’s preload options.
     *
     * Utility for configuring the `.preload` and `.preloadData` properties of [.config]{@link module:reading-data~config}.
     *
     * @param  {Object|Boolean} arg Passing an object will register this object as the data to be preloaded and enable preloading. Passing true/false will enable/disable preloading.
     * @return {Object} Returns [ReadingData]{@link module:reading-data} to allow for method chaining.
     *
     * @example
     * const RD = require('@delucis/reading-data')
     * const EXISTING_DATA = require('./some-data-i-saved-earlier.json')
     *
     * RD.preloadData(EXISTING_DATA)
     * // Equivalent to:
     * // RD.config.preload = true
     * // RD.config.preloadData = EXISTING_DATA
     *
     * RD.preloadData(false)
     * // Equivalent to:
     * // RD.config.preload = false
     *
     * @since 0.0.1
     */
    preloadData: function (arg) {
      if (typeof arg === 'object') {
        config.preloadData = arg
        config.preload = true
        return this
      }
      if (typeof arg === 'boolean') {
        config.preload = arg
        return this
      }
      throw new Error('ReadingData#preloadData(): first argument must be an object or a boolean value, but was ' + typeof arg + '.')
    },

    /**
     * Trigger [ReadingData]{@link module:reading-data}’s data gathering cycle:
     * `preload`, `fetch`, `process`.
     *
     * @return {Object} Returns [ReadingData]{@link module:reading-data} to allow for method chaining.
     *
     * @example <caption>Use with Promise-style syntax</caption>
     * const RD = require('@delucis/reading-data')
     * const helpfulPlugin = require('helpful-reading-data-plugin')
     *
     * RD.use(helpfulPlugin)
     *
     * RD.run().then((result) => {
     *   console.log(result.data)
     * })
     *
     * @example <caption>Use in an asynchronous function</caption>
     * const RD = require('@delucis/reading-data')
     * const helpfulPlugin = require('helpful-reading-data-plugin')
     *
     * RD.use(helpfulPlugin)
     *
     * let asynchronousDataLogger = async function () {
     *   await RD.run()
     *   console.log(RD.data)
     * }
     *
     * asynchronousDataLogger()
     *
     * @since 0.0.1
     */
    run: async function () {
      let timer = TIMESPAN()
      meta.runtime = meta.runtimePretty = null
      preload(this)
      await callHooks(this)
      meta.runtime = timer()
      meta.runtimePretty = MS(meta.runtime)
      return this
    }
  }
}())

module.exports = ReadingData
