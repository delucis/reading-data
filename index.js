/**
 * @module reading-data
 * @requires winston
 */

const log = require('winston')

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
   * Array holding the currently installed plugins.
   *
   * @memberof module:reading-data
   * @private
   * @type {Array}
   */
  let plugins = []

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
  }

  /**
   * Call plugins’ `.fetch()` properties and add the returned value to
   * [.data]{@link module:reading-data~data}.
   *
   * @memberof module:reading-data
   * @private
   * @param  {Object} context Contextual this passed from {@link module:reading-data~run}
   * @return {Object}         context.data after all plugins have returned their data.
   */
  let fetch = async function (context) {
    log.debug('Fetching data...')
    await Promise.all(plugins.map(async plugin => {
      if (plugin.hasOwnProperty('fetch')) {
        let pluginConfig = context.config.plugins[plugin.__id__]
        let pluginContext = {
          config: pluginConfig,
          data: context.data[pluginConfig.scope]
        }
        let pluginData
        if (typeof plugin.fetch === 'function') {
          pluginData = await plugin.fetch(pluginContext, context)
        } else if (typeof plugin.fetch === 'object') {
          pluginData = plugin.fetch
        }
        if (pluginData) {
          context.data[pluginContext.config.scope] = pluginData
        }
      }
    }))
    return context.data
  }

  /**
   * Call plugins’ `.process()` properties and add the returned values to
   * [.data]{@link module:reading-data~data}.
   *
   * @memberof module:reading-data
   * @private
   * @param  {Object} context Contextual this passed from {@link module:reading-data~run}
   * @return {Object}         context.data after all plugins have returned their data.
   */
  let process = async function (context) {
    log.debug('Processing data...')
    await Promise.all(plugins.map(async plugin => {
      if (plugin.hasOwnProperty('process') && typeof plugin.process === 'function') {
        let pluginConfig = context.config.plugins[plugin.__id__]
        let pluginContext = {
          config: pluginConfig,
          data: context.data[pluginConfig.scope]
        }
        let processedData = await plugin.process(pluginContext, context)
        context.data[pluginContext.config.scope] = processedData
      }
    }))
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
     * Configuration settings for use during [.run()]{@link module:reading-data~run}.
     *
     * @type {Object}
     * @prop {Object}  plugins={}     - Holds configuration for installed plugins.
     * @prop {Boolean} preload=false  - Enables/disables preloading of data.
     * @prop {Object}  preloadData={} - Holds data to be preloaded.
     *
     * @since 0.0.1
     */
    config: config,

    /**
     * Array containing the currently installed plugins.
     *
     * @type {Array}
     * @since 0.0.1
     */
    plugins: plugins,

    // PUBLIC FUNCTIONS
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
      let pluginConfig = Object.assign((plugin.config || {}), (opts || {}))
      config.plugins[id] = pluginConfig
      plugin.config = config.plugins[id]
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
      preload(this)
      await fetch(this)
      await process(this)
      return this
    }
  }
}())

module.exports = ReadingData
