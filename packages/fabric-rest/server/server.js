//
// Copyright IBM Corp. All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var http = require('http');
var https = require('https');
const argv = require('yargs')
            .usage('Usage: [options]')
            // Allow all variables to be set via ENV variables prefixed REST_
            .env('REST')
            .option('p', {
              alias: 'port',
              default: 3000,
              describe: 'Port server listens on'
            })
            .option('s', {
              alias: 'https',
              default: false,
              describe: 'Use HTTPS'
            })
            .option('hfc-logging', {
              describe: 'Set logging options, e.g. {"debug":"console"}'
            })
            .help('h')
            .alias('h', 'help')
            .argv;

var passport = require('passport');
var Strategy = require('passport-http').BasicStrategy;
var db = require('./db');

var app = module.exports = loopback();

passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));

if (argv.https) {
  var sslConfig = require('./ssl-config');
}

app.start = function() {
  var server = null;

  if (argv.https) {
    var options = {
      key: sslConfig.privateKey,
      cert: sslConfig.certificate
    };
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }

  var port = argv.port ? argv.port : app.get('port');
  if (typeof port != "number") {
    throw new TypeError('Port not a number');
  }

  return server.listen(port, function() {
    var baseUrl = (argv.https ? 'https://' : 'http://') + app.get('host') + ':' + port;
    app.emit('started', baseUrl);
    console.log('Hyperledger Fabric SDK REST server listening at %s%s', baseUrl, '/');
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
