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
    , defaultTTL = options.defaultTTL || 600
    , minTTL = options.minTTL || 0
    , maxTTL = options.maxTTL || Infinity
    , negativeTTL = options.negativeTTL || defaultTTL
    ;

  return function(req, res, next) {
    var key = req.headers.host.split(':')[0]
      , hit = cache.get(key)
      , ttl
      ;

    req.on('dhr2', function(dhr2) {
      dhr2 = dhr2 || {retrieved: new Date, negative: true, ttl: negativeTTL};
      cache.set(key, dhr2);
    });

    if (hit) {
      ttl = hit.ttl || defaultTTL;
      if (ttl < minTTL) ttl = minTTL;
      else if (ttl > maxTTL) ttl = maxTTL;

      if ((Date.now() - ttl*1000) < hit.retrieved) {

        if (hit.negative) {
          req._negativeDHR2 = true;
          next();
        } else {
          exports.respond(req, res, hit);
        }
        return;
      }

      cache.del(key);
    }

    next();
  }
};


exports.handle = function(req, res, next) {
  if (req._negativeDHR2) return next();

  var host = req.headers.host;
  if (!host) return next();

  // remote port
  host = host.split(':')[0];

  base.lookup(host, function(err, dhr2) {
    if (err) return next(err);

    // cacheMiddleware
    req.emit('dhr2', dhr2);

    if (!dhr2) return next();

    exports.respond(req, res, dhr2);
  });
};


exports.respond = function(req, res, dhr2) {
  var url = dhr2.location;
  if (!dhr2.ignorePath) {
    url += req.url;
  }

  var content = '<!DOCTYPE html><title>301 Moved</title><h1>301 Moved</h1>'
    + 'The document has moved <a href="' + url + '">here</a>.';

  var now = new Date();

  res.setHeader('Date', new Date().toGMTString());
  res.setHeader('Location', url);
  res.setHeader('Content-Length', Buffer.byteLength(content));
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Age', Math.round((now-dhr2.retrieved)/1000));

  if (dhr2.ttl) {
    res.setHeader('Expires', new Date(Date.now() + dhr2.ttl).toGMTString());
    res.setHeader('Cache-Control', 'public, max-age=' + dhr2.ttl);
  }

  res.statusCode = dhr2.statusCode;

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  res.write(content);
  res.end();
};
