var records = [
    { id: 1, username: 'chris', password: 'secret', displayName: 'Chris', emails: [ { value: 'chris@example.com' } ] }
];

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
}
