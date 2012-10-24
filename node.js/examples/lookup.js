var dhr2 = require('..');

dhr2.lookup('example.com', function(err, result) {
  if (err) throw err;

  if (!result) {
    console.log('No match');
  } else {
    console.log('Location: ' + result.location);
  }
});
