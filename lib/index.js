var dns = require('dns')
  , Stream = require('stream')
  ;

exports.lookup = lookup;
exports.parse = parse;
exports.DHFR = DHFR;


exports.middleware = function() {
  return exports.handle;
};

exports.handle = function(req, res, next) {
  var host = req.headers.host;
  if (!host) return next();

  lookup(host, function(err, result) {
    if (err) return next(err);
    if (!result) return next();

    var url = result.location;
    if (!result.ignorePath) {
      url += req.url;
    }

    var content = '<!DOCTYPE html><title>301 Moved</title><h1>301 Moved</h1>'
      + 'The document has moved <a href="' + url + '">here</a>.';


    res.setHeader('Date', new Date().toGMTString());
    res.setHeader('Location', url);
    res.setHeader('Content-Length', Buffer.byteLength(content));
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');

    if (result.ttl) {
      res.setHeader('Expires', new Date(Date.now() + result.ttl).toGMTString());
      res.setHeader('Cache-Control', 'public, max-age=' + result.ttl);
    }

    res.statusCode = 301;

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    var stream = new Stream();
    stream.readable = true;

    stream.pipe(res);

    // Connect staticCache middleware does not cache the statusCode
    //req.emit('static', stream);

    stream.emit('data', content);
    stream.emit('end');
  });
};


function lookup(domainName, cb) {
  dns.resolve(domainName, 'TXT', function(err, results) {
    if (err) return cb( (err.code === dns.NODATA ? null : err) );


    results = results
      .map(parse)
      .filter(function(info) {
        return info.v === 'dhfr1';
      })
      .map(DHFR)
      .sort(function(a, b) {
        if (a.priority == b.priority) {
          a = a.domainName.length;
          b = b.domainName.length;
        } else {
          a = a.priority;
          b = b.priority;
        }

        return a < b ? 1 : a > b ? -1 : 0;
      })
      ;

    for(var i = 0, len = results.length; i < len; i++) {
      if (results[i].match(domainName)) {
        return cb(null, results[i]);
      }
    }

    // No match
    cb(null);
  });
}


var splitRegexp = /;(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/;
var quotesRegexp = /^\".*\"$/;

function parse(txt) {
  txt = txt.split(splitRegexp);

  var res = {};

  for(var i = 0, len = txt.length; i < len; i++) {
    var key, val
      , x = txt[i].trim()
      , idx = x.indexOf('=')
      ;

    if (!~idx) {
      key = x;
      val = true;
    } else {
      key = x.substring(0, idx).trim();
      val = x.substring(idx + 1).trim();

      if (quotesRegexp.test(val)) {
        val = val.substring(1, val.length-2);
      }
    }

    res[key] = val;
  }

  return res;
}



function escapeRegExp(text) {
  return text.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&");
}

var protocolRegexp = /^https?\:\/\//;

function DHFR(info) {
  if (!(this instanceof DHFR)) return new DHFR(info);

  // Required
  this.version = info.v;
  this.location = info.l;

  // Optional
  this.ttl = Number(info.t) || 0;
  this.domainName = info.d || '*';
  this.priority = Number(info.p) || 0;
  this.ignorePath = !!info.i;


  if (!protocolRegexp.test(this.location)) {
    this.location = 'http://' + this.location;
  }


  this.regexp = new RegExp('^' + escapeRegExp(this.domainName).replace(/\*/g, '(.*)') + '$', 'i');

  if (!this.priority) {
    if (this.domainName === '*') {
      this.priority = -3;
    } else if (~this.domainName.indexOf('*')) {
      this.priority = -2;
    } else {
      this.priority = -1;
    }
  }
}

DHFR.prototype.match = function(domainName) {
  return this.regexp.test(domainName);
};
