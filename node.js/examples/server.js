var dhr2 = require('..')
  , http = require('http')
  ;

http.createServer(function(req, res) {
  dhr2.handle(req, res, function(err) {
    if (err) {
      res.writeHead(500);
      res.end(err.stack);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });
}).listen(1337);
