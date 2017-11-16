//
// Copyright IBM Corp. All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
'use strict';

module.exports = function(app) {
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;
  var walletContents = require('../private/wallet');

  User.create(walletContents.records, function(err, users) {
    if (err) throw err;

    // Create the admin role
    Role.create({
      name: 'admin'
    }, function(err, role) {
      if (err) throw err;

      // Make Alice an admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[0].id
      }, function(err, principal) {
        if (err) throw err;
      });

      Role.registerResolver('$authenticated', function(role, context, cb) {
        cb(null, true);});
    });

    Role.create({
      name: 'user'
    }, function(err, role) {
      if (err) throw err;

      // Make Alice an admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[1].id
      }, function(err, principal) {
        if (err) throw err;
      });
    });
  });
};
