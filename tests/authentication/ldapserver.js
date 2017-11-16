//
// Copyright IBM Corp. All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//

'use strict';

const ldap = require('ldapjs');

const authorize = function (req, res, next) {
  return next();
};

const SUFFIX = 'dc=example, dc=org';
let server = null;

const db = {
  alice: {
    dn: 'cn=alice, dc=example, dc=org',
    attributes:  {
      uid: 'alice',
      name: 'Alice',
      mail: 'alice@example.org'
    }
  }
};

exports.start = function (port, password) {
  if (server) {
    return Promise.resolve();
  }

  server = ldap.createServer();

  server.bind('cn=root, dc=example, dc=org', function(req, res, next) {
    if (req.dn.toString() !== 'cn=root, dc=example, dc=org' || req.credentials !== password) {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  });

  server.bind(SUFFIX, authorize, function(req, res, next) {
    let dn = req.dn.toString();
    if (dn !== 'cn=alice, dc=example, dc=org' || req.credentials !== password) {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  });

  server.search(SUFFIX, authorize, function(req, res, next) {
    if (req.filter.attribute === 'uid' && req.filter.value === 'alice') {
      res.send(db.alice);
    }
    res.end();
    return next();
  });

  return new Promise((resolve, reject) => {
    server.listen(port, (error) => {
      if (error) {
        return reject(error);
      }
      resolve(server.address().port);
    });
  });
};

exports.close = function () {
  if (server) {
    server.close();
    server = null;
  }
};
