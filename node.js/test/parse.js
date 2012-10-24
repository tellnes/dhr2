var dhr2 = require('..')
  , should = require('should')
  ;

describe('Parse', function() {

  describe('Valid records', function() {
    var obj = dhr2.parse('v=DHR2/1; l=http://www.example.com');

    it('should return an instance of DHR2', function() {
      should.exist(obj);
      obj.should.be.an.instanceof(dhr2.DHR2);
    });

    it('should have correct properties', function() {
      obj.version.should.equal('DHR2/1');
      obj.location.should.equal('http://www.example.com/');
      obj.statusCode.should.equal(302);
      obj.ttl.should.equal(0);
      obj.domainName.should.equal('*');
      obj.ignorePath.should.be.false;
    });

  });

  describe('Invalid records that should be ignored', function() {
    it('missing location', function() {
      var obj = dhr2.parse('v=DHR2/1');
      should.not.exist(obj);
    });
    it('newline in location', function() {
      var obj = dhr2.parse('v=DHR2/1; l=http://www.example.com\nX-Attack: attack');
      should.not.exist(obj);
    });

    it('spf1 record', function() {
      var obj = dhr2.parse('v=spf1 include:aspmx.googlemail.com ~all');
      should.not.exist(obj);
    });
    it('DMARC1 record', function() {
      var obj = dhr2.parse('v=DMARC1; p=none; rua=mailto:postmaster@example.com');
      should.not.exist(obj);
    });

    it('DKIM record', function() {
      var obj = dhr2.parse('v=DKIM1; k=rsa; t=y; p=ASDF');
      should.not.exist(obj);
    });

  });

});
