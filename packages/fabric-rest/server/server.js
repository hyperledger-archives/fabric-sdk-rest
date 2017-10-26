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
            .config({extends:'./server/config.json'})
            // Allow all variables to be set via ENV variables prefixed REST_
            .env('REST')
            .option('P', {
              alias: 'port',
              describe: 'The port to serve the REST API on',
              type: 'number'
            })
            .option('t', {
              alias: 'tls',
              default: false,
              describe: 'Enable TLS security for the REST API',
              type: 'boolean'
            })
            .option('p', {
              alias: 'connectionProfileName',
              describe: 'TODO (SDK v1.1 prereq) - The connection profile name',
              type: 'string'
            })
            .option('c', {
              alias: 'tlscert',
              describe: 'TODO - File containing the TLS certificate',
              type: 'string'
            })
            .option('k', {
              alias: 'tlskey',
              describe: 'TODO - File containing the TLS private key',
              type: 'string'
            })
            .implies('tlscert','tls')
            .implies('tlskey','tls')
            .option('hfc-logging', {
              describe: 'Set logging options, e.g. {"debug":"console"}',
              type: 'string'
            })
            .help('h')
            .version()
            .alias('h', 'help')
            .argv;

var session = require('express-session');
var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-http').BasicStrategy;
var wallet = require('./wallet');

var app = module.exports = loopback();
var passportConfigurator = new PassportConfigurator(app);

if (argv.tls) {
  var sslConfig = require('./ssl-config');
}

app.start = function() {
  var User = app.models.user;

  // Parse JSON-encoded bodies, or URL-encoded bodies
  app.middleware('parse', bodyParser.json());
  app.middleware('parse', bodyParser.urlencoded({
    extended: true
  }));

  app.middleware('auth', loopback.token({
    model: app.models.accessToken
  }));

  app.middleware('session:before', cookieParser(app.get('cookieSecret')));
  app.middleware('session', session({
    secret: 'kitty',
    saveUninitialized: true,
    resave: true
  }));
  passportConfigurator.init();

  passportConfigurator.setupModels({
    userModel: app.models.user,
    userIdentityModel: app.models.userIdentity,
    userCredentialModel: app.models.userCredential
  });

  // Read providers.json file if it exists, or revert to HTTP basic auth
  var passportConfig = {};
  try {
    passportConfig = require('./providers.json');
  } catch (err) {
    passport.use(new Strategy(function(username, password, cb) {
      wallet.validateUser(app, username, password, cb);
    }));
    var router = app.loopback.Router();
    router.get('/', app.loopback.status());
    app.use(passport.authenticate('basic', { session: false }),
            function(req, resp, next) {
              User.login(req.user, 'user', function (err, token) {
                if (err) console.log(err);
              });
              next();
            });
  }

  for (var s in passportConfig) {
    var c = passportConfig[s];
    c.session = c.session !== false;
    passportConfigurator.configureProvider(s, c);
  }
  var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

  app.get('/auth/logout', function(req, res, next) {
    req.logout();
    res.end();
  });

  var server = null;

  if (argv.tls) {
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
    var baseUrl = (argv.tls ? 'https://' : 'http://') + app.get('host') + ':' + port;
    app.emit('started', baseUrl);
    console.log('Hyperledger Fabric SDK REST server listening at %s%s', baseUrl, '/');
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
