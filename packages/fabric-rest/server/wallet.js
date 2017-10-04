//
// Copyright IBM Corp. All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
'use strict';
var walletContents = require('./private/wallet');

var findByUsername = exports.findByUsername = function(username, cb) {
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

exports.validateUser = function(username, password, cb) {
  findByUsername(username, function(err, user) {
    if (err) { return cb(err); }
    if (!user) { return cb(null, false); }
    if (user.password != password) { return cb(null, false); }
    return cb(null, user);
  });
};
