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

// Read providers.json file if it exists, or revert to HTTP basic auth
var passportConfig = {};
try {
  passportConfig = require('./providers.json');
} catch (err) {
  passport.use(new Strategy(function(username, password, cb) {
    wallet.validateUser(username, password, cb);
  }));
  var router = app.loopback.Router();
  router.get('/', app.loopback.status());
  app.use(passport.authenticate('basic', { session: false }),
          router);
}

if (argv.https) {
  var sslConfig = require('./ssl-config');
}

app.start = function(httpOnly) {

  // Parse JSON-encoded bodies, or URL-encoded bodies
  app.middleware('parse', bodyParser.json());
  app.middleware('parse', bodyParser.urlencoded({
    extended: true,
  }));

  app.middleware('auth', loopback.token({
    model: app.models.accessToken,
  }));

  app.middleware('session:before', cookieParser(app.get('cookieSecret')));
  app.middleware('session', session({
    secret: 'kitty',
    saveUninitialized: true,
    resave: true,
  }));
  passportConfigurator.init();

  passportConfigurator.setupModels({
    userModel: app.models.user,
    userIdentityModel: app.models.userIdentity,
    userCredentialModel: app.models.userCredential,
  });
  for (var s in passportConfig) {
    var c = passportConfig[s];
    c.session = c.session !== false;
    passportConfigurator.configureProvider(s, c);
  }
  var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

  app.get('/auth/logout', function(req, res, next) {
    req.logout();
  });
  
  if (httpOnly === undefined) {
    httpOnly = process.env.HTTP;
  }

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
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
