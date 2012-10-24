var dhr2 = require('..')
  , connect = require('connect')
  ;

var app = connect();

app.use(dhr2.middleware());

app.use(function(req, res, next) {
  res.end('no match');
});

app.listen(1337);
