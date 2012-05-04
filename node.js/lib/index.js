var base = require('./base')
  , server = require('./server');

exports.lookup = base.lookup;
exports.parse = base.parse;
exports.DHFR = base.DHFR;

exports.middleware = server.middleware;
exports.cacheMiddleware = server.cacheMiddleware;
exports.handle = server.handle;
