var dhr2 = require('..')
  , httpProxy = require('http-proxy')
  ;


httpProxy.createServer(
  function(req, res, next) {
    req.buffer = httpProxy.buffer(req);
    next();
  },
  dhr2.middleware({
    cache: {
      defaultTTL: 10,
      minTTL: 10
    }
  }),
  function(req, res, proxy) {
    proxy.proxyRequest(req, res, {
      host: 'localhost',
      port: 80,
      buffer: req.buffer
    });
  }
).listen(1337);
