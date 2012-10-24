var base = require('./base')
  , server = require('./server');

exports.lookup = base.lookup;
exports.parse = base.parse;
exports.DHR2 = base.DHR2;

exports.middleware = server.middleware;
exports.cacheMiddleware = server.cacheMiddleware;
exports.handle = server.handle;
