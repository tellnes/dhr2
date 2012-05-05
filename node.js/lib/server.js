var base = require('./base')
  , LRU = require('lru-cache')
  ;


exports.middleware = function(options) {
  options = options || {};

  if (options.cache) {
    var cacheHandler = exports.cacheMiddleware(options.cache);
    return function(req, res, next) {
      cacheHandler(req, res, function(err) {
        if (err) return next(err);
        exports.handle(req, res, next);
      });
    }
  } else {
    return exports.handle;
  }
};


exports.cacheMiddleware = function(options) {
  options = options || {};

  var cache = new LRU(options.maxObjects)
    , defaultTTL = options.defaultTTL || 10
    , minTTL = options.minTTL || 0
    , maxTTL = options.maxTTL || Infinity
    ;

  return function(req, res, next) {
    var key = req.headers.host.split(':')[0]
      , hit = cache.get(key)
      , ttl
      ;

    req.on('dhfr', function(dhfr) {
      cache.set(key, dhfr);
    });

    if (hit) {
      ttl = hit.ttl;
      if (ttl < minTTL) ttl = minTTL;
      else if (ttl > maxTTL) ttl = maxTTL;

      if ((Date.now() - ttl*1000) < hit.retrieved) {
        res.setHeader('X-Cache', 'hit');
        exports.respond(req, res, hit);
        return;
      }

      cache.del(key);
    }

    res.setHeader('X-Cache', 'miss');
    next();
  }
};


exports.handle = function(req, res, next) {
  var host = req.headers.host;
  if (!host) return next();

  // remote port
  host = host.split(':')[0];

  base.lookup(host, function(err, dhfr) {
    if (err) return next(err);
    if (!dhfr) return next();

    req.emit('dhfr', dhfr);
    exports.respond(req, res, dhfr);
  });
};


exports.respond = function(req, res, dhfr) {
  var url = dhfr.location;
  if (!dhfr.ignorePath) {
    url += req.url;
  }

  var content = '<!DOCTYPE html><title>301 Moved</title><h1>301 Moved</h1>'
    + 'The document has moved <a href="' + url + '">here</a>.';

  var now = new Date();

  res.setHeader('Date', new Date().toGMTString());
  res.setHeader('Location', url);
  res.setHeader('Content-Length', Buffer.byteLength(content));
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Age', Math.round((now-dhfr.retrieved)/1000));

  if (dhfr.ttl) {
    res.setHeader('Expires', new Date(Date.now() + dhfr.ttl).toGMTString());
    res.setHeader('Cache-Control', 'public, max-age=' + dhfr.ttl);
  }

  res.statusCode = dhfr.statusCode;

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  res.write(content);
  res.end();
};
