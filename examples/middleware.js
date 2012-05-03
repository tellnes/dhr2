var dhfr = require('..')
  , connect = require('connect')
  ;

var app = connect();

app.use(dhfr.middleware());

app.use(function(req, res, next) {
  res.end('no match');
});

app.listen(1337);
