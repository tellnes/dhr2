
/*!
 * DHFR - Cache
 * Copyright(c) 2012 Christian Tellnes
 * MIT Licensed
 */

/**
 * Expose `Cache`.
 */

module.exports = Cache;


/**
 * LRU cache store.
 *
 * @param {Object} options
 * @api public
 */

function Cache(options) {
  options = options || {};

  this.defaultTTL = options.defaultTTL || 600;
  this.minTTL = options.minTTL || 0;
  this.maxTTL = options.maxTTL || Infinity;
  this.maxItems = options.maxItems || 128;

  this.gcFrequency = options.gcFrequency || 10;
  this.gcMin = options.gcMin || 1;


  this.store = {};
  this.items = 0;
  this.gcLast = 0;

  this.gcHandler = this.gc.bind(this);
  this.gcTimeout = setTimeout(this.gcHandler, this.gcInterval*1000);
}

/**
 * Add a cache `key`.
 *
 * @param {String} key
 * @api public
 */

Cache.prototype.add = function(key, value, ttl) {
  if (this.store[key]) this.remove(key);

  this.items++;
  var item = this.store[key] = {};
  item.key = key;
  item.createdAt = Date.now();
  item.lastAccessed = item.createdAt;
  item.value = value;

  item.ttl = ttl || this.defaultTTL;
  if (item.ttl < this.minTTL) item.ttl = this.minTTL;
  else if (item.ttl > this.maxTTL) item.ttl = this.maxTTL;

  if (this.items > this.maxItems) {
    this.scheduleGc();
  }
};

/**
 * Get the object stored for `key`.
 *
 * @param {String} key
 * @return {Array}
 * @api public
 */

Cache.prototype.get = function(key){
  var item = this.store[key];

  if (item) {
    if ((item.createdAt + item.ttl*1000) > Date.now()) {
      // if the item is not expired
      // update its last accessed date
      item.lastAccessed = Date.now();
      return item.value;

    } else {
      // if the item is expired, remove it from the cache
      this.remove(key);
    }
  }

  return null;
};

/**
 * Remove `key`.
 *
 * @param {String} key
 * @api public
 */

Cache.prototype.remove = function(key){
  delete this.store[key];
  this.items--;
};

/**
 * Destroys the cache object
 *
 * @api public
 */

Cache.prototype.destroy = function() {
  clearTimeout(this.gcTimeout);
};

/**
 * Schedule garbage collection
 *
 * @api private
 */

Cache.prototype.scheduleGc = function() {
  if ((this.gcLast + this.gcMin*1000) > Date.now()) return;

  clearTimeout(this.gcTimeout);

  var self = this;
  process.nextTick(function() {
    self.gc();
    self.gcTimeout = setTimeout(self.gcHandler, self.gcInterval*1000);
  });
};

/**
 * Run garbage collection
 *
 * @api private
 */

Cache.prototype.gc = function() {
  this.gcLast = Date.now();

  var removeCount = this.items > this.maxItems ? this.items - this.maxItems : 0
    , remove = []
    ;

  var key, item, i, len;

  for (key in this.store) {
    item = this.store[key];
    if ((item.createdAt + item.ttl*1000) < Date.now()) {
      this.remove(key);
      removeCount--;
      break;
    }

    if (removeCount) {

      for(i = 0, len = remove.length; i < len; i++) {
        if (item.lastAccessed < remove[i].lastAccessed) {
          if (len < removeCount) {
            remove.splice(i, 0, item);
          } else {
            remove[i] = item;
          }
          break;
        }
      }

      if (remove.length < removeCount && remove[i] != item) {
        remove.push(item);
      }
    }
  }

  for(i = 0, len = remove.length; i < len; i++) {
    this.remove(remove[i].key);
  }
};
