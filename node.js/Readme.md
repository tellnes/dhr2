# DHR2 implementation in Node.js


This is an implementation of the DHR2 specification [Node.js](http://nodejs.org/). It can either be used as a middleware to [connect](https://github.com/senchalabs/connect) or as a standalone server.

See the examples folder for usage examples.

## Installation

    $ git clone git://github.com/tellnes/dhfr.git
    $ cd dhfr/node.js
    $ npm install

## Usage

### dhfr.lookup(hostname, callback)

Responds with a `DHR2` object if it finds a matching DHR2 record.

### dhfr.parse(string)

Parses a DHR2 string and returns a `DHR2` object if the string is valid.

### dhfr.handle(req, res, next)

Handles an http request and calls the `next` function if it does not find any DHR2 entry. This is used internally by `dhfr.middleware`.

### dhfr.middleware(options)

Connect compatible middleware. Possible options are `cache` that adds the caching middleware. The value of the `cache` option is passed as the options argument to `dhfr.cacheMiddleware`.

### dhfr.cacheMiddleware(options)

Connect compatible middleware that is caching the dhfr responses by `dhfr.handle`. Possible options are:

- __maxObjects__ Max cache objects
- __defaultTTL__ ttl value for dhfr records that does not have a ttl. Default is `10`
- __minTTL__ Minimum ttl value
- __maxTTL__ Maximum ttl value
- __negativeTTL__ TTL value for negative DHR2 lookups. Default is `defaultTTL`


## Running tests

    $ npm isntall -d
    $ npm test


## License

It´s [MIT](http://tellnes.mit-license.org/)
