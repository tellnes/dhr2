var dhfr = require('..')
  , http = require('http')
  ;

http.createServer(function(req, res) {
  dhfr.handle(req, res, function(err) {
    if (err) {
      res.writeHead(500);
      res.end(err.stack);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });
}).listen(1337);
