var dns = require('dns')
  , url = require('url')
  ;



function lookup(domainName, cb) {
  dns.resolve(domainName, 'TXT', function(err, results) {
    if (err) return cb( (err.code === dns.NODATA ? null : err) );


    results = results
      .map(parse)
      .filter(function(dhfr) {
        return dhfr;
      })
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

var versionRegexp = /^DHFR1$/i;
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

  if (!versionRegexp.test(res.v)) return null;

  if (!protocolRegexp.test(res.l)) {
    res.l = 'http://' + res.l;
  }

  if (res.l !== url.format(url.parse(res.l))) return null;

  return new DHFR(res);
}



function escapeRegExp(text) {
  return text.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&");
}

var protocolRegexp = /^https?\:\/\//;

function DHFR(info) {
  if (!(this instanceof DHFR)) return new DHFR(info);

  this.retrieved = new Date();

  // Required
  this.version = info.v;
  this.location = info.l;

  // Optional
  this.statusCode = info.s == 'm' ? 301 : 302;
  this.ttl = Number(info.t) || 0;
  this.domainName = info.d || '*';
  this.priority = Number(info.p) || 0;
  this.ignorePath = !!info.i;


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


exports.lookup = lookup;
exports.parse = parse;
exports.DHFR = DHFR;
