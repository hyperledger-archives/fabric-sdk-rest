//
// Copyright IBM Corp. All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
'use strict';
var walletContents = require('./private/wallet');

var findByUsername = function(username, cb) {
  process.nextTick(function() {
    for (var i = 0, len = walletContents.records.length; i < len; i++) {
      var record = walletContents.records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
};

exports.validateUser = function(app, username, password, cb) {
  findByUsername(username, function(err, user) {
    var User = app.models.user;
    
    if (err) { return cb(err); }
    if (!user) { return cb(null, false); }
    if (user.password != password) { return cb(null, false); }

    User.login({
      username: username, password: password
    }, 'user', function(err, token) {
      if (err) {
        console.log("Error logging in user!!");
      }});

    return cb(null, user);
  });
};
