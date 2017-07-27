# @delucis/reading-data

[![Build Status](https://travis-ci.org/delucis/reading-data.svg?branch=master)](https://travis-ci.org/delucis/reading-data)

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
to add support for individual services via its `.use()` method.

An arbitrary number of plugins can be included and then run in parallel using
the `.run()` method.

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


### Preloading Data

You may have existing data that should be expanded upon or used during the
`.run()` cycle. If so, you can pass it to a `reading-data` instance using the
`.preloadData()` method.

```js
const READING_DATA = require('@delucis/reading-data')
const EXISTING_DATA = require('./some-data-i-saved-earlier.json')

READING_DATA.preloadData(EXISTING_DATA)
```

This is equivalent to setting the configuration as follows:

```js
READING_DATA.config.preloadData = EXISTING_DATA
READING_DATA.config.preload = true
```
