# @delucis/reading-data

[![Build Status](https://travis-ci.org/delucis/reading-data.svg?branch=master)](https://travis-ci.org/delucis/reading-data)
[![Coverage Status](https://coveralls.io/repos/github/delucis/reading-data/badge.svg?branch=master)](https://coveralls.io/github/delucis/reading-data?branch=master)
[![npm (scoped)](https://img.shields.io/npm/v/@delucis/reading-data.svg)](https://www.npmjs.com/package/@delucis/reading-data)

Aggregate data from different sources.


## Installation

```sh
npm install --save @delucis/reading-data
```


## Usage

### Introduction

`@delucis/reading-data` provides an interface for gathering data from
third-party APIs such as [Instapaper][1b1ac993].

  [1b1ac993]: https://www.instapaper.com/

On its own, this module doesn’t do much but provides a framework for plugins
to add support for individual services via its [`.use()` method][331f159c].

  [331f159c]: https://delucis.github.io/reading-data/module-reading-data.html#~use ".use() in the reading-data documentation"

An arbitrary number of plugins can be included and then run in parallel using
the [`.run()` method][81e02dd2].

  [81e02dd2]: https://delucis.github.io/reading-data/module-reading-data.html#~run ".run() in the reading-data documentation"

```js
const READING_DATA = require('@delucis/reading-data')
const INSTAPAPER_PLUGIN = require('@delucis/reading-data-instapaper')

READING_DATA.use(INSTAPAPER_PLUGIN, {
  // plugin settings
})

READING_DATA.run()
```


### Handling Asynchronous Responses

Often, plugins can take some time to fetch data. For example, they might be
sending a request over the network or loading a file from disk. `reading-data`
makes it easy to wait for this data to arrive and then use it.

This can be achieved either by using `.then()` Promise syntax…

```js
READING_DATA.run().then((result) => {
  console.log(result.data) // prints the gathered data to the console
})
```

…or by writing your own asynchronous functions.

```js
myAsyncDataLogger = async function () {
  await READING_DATA.run()
  console.log(READING_DATA.data)
}

myAsyncDataLogger()  // prints the gathered data to the console
```


### Hooks during `.run()`

When you call `.run()` on a `reading-data` instance, by default it will cycle
through three hooks — `preload`, `fetch`, and `process` — calling each plugin
that is configured for that hook. Additional hooks can be registered using the
[`.addHook()` method][37d6ce9e].

  [37d6ce9e]: https://delucis.github.io/reading-data/module-reading-data.html#~addHook ".addHook() in the reading-data documentation"

If a plugin does not set a default hook to run on, it will be called during the
`fetch` hook.

This can be configured by setting a `hooks` option for that plugin.

```js
// call myPlugin.data() during the preload hook
READING_DATA.use(myPlugin, {
  hooks: 'preload'
})
```


### Scoping your data

When you call `.run()` on a `reading-data` instance, it adds data returned by
any plugins in use to its `.data` property. You set the scope for a plugin
in its options object.

```js
READING_DATA.use(myPlugin, {
  scope: 'testData'
})
// returns data to READING_DATA.data.testData
```

This means you can have multiple plugins working during the same hook, but with
separate scopes. If you need to work on the same scope with several plugins, for
example in order to first fetch some data and then process it, this must be done
in different hooks. Scopes are called in parallel, while hooks are called
sequentially.

```js
READING_DATA.use(myFetchPlugin, {
  scope: 'myData',
  hooks: 'fetch'
}).use(myProcessingPlugin, {
  scope: 'myData',
  hooks: 'process'
})
```

### Preloading Data

You may have existing data that should be expanded upon or used during the
`.run()` cycle. If so, you can pass it to a `reading-data` instance using the
`.preloadData()` method.

```js
const READING_DATA = require('@delucis/reading-data')
const EXISTING_DATA = require('./some-data-i-saved-earlier.json')

READING_DATA.preloadData(EXISTING_DATA)
```

The `.preloadData()` method can also enable or disable data preloading if passed
a boolean:

```js
READING_DATA.preloadData(false) // disables preloading
```

#### Preloading data tries to be non-destructive

When the `.run()` method is called, preloaded data will be added
key-by-key to `.data` using `Object.assign`. This means it is safe to use
`.preloadData()` on a `reading-data` instance that is already holding some data
as long as you are scoping your data properly.

```js
READING_DATA.use(myPlugin, { scope: 'myPluginScope' })
READING_DATA.run() // adds some data to READING_DATA.data.myPluginScope
READING_DATA.uninstall(myPlugin) // removes the plugin that added data

READING_DATA.preloadData({ myPreloadScope: { /* ... */ }})
READING_DATA.run()
// READING_DATA.data now contains:
// {
//   myPluginScope: { /* ... */ },
//   myPreloadScope: { /* ... */ }
// }
```

#### Preloading data only happens once

Data preloading only happens the first time the `.run()` method is called after
using `.preloadData()`. This prevents the same data being loaded twice and
avoids overwriting a scope that may have been updated with newer data by a
plugin.

In general this is probably the desired behaviour in a flow that moves from
preloading data, to fetching data, to processing data. If you need to re-load
data that you had previously preloaded, simply pass `true` to `.preloadData()`.

```js
let dataToLoad = { myPreloadScope: { text: 'I pre-exist.' } }
READING_DATA.preloadData(dataToLoad)
READING_DATA.run() // adds dataToLoad to READING_DATA.data
READING_DATA.run() // doesn’t try to reload dataToLoad
READING_DATA.preloadData(true)
READING_DATA.run() // adds dataToLoad to READING_DATA.data
```
