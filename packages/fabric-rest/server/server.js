//
// Copyright IBM Corp. All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var fs = require("fs");
var path = require("path");

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
            .option('p', {
              alias: 'connectionProfileName',
              describe: 'TODO (SDK v1.1 prereq) - The connection profile name',
              type: 'string'
            })
            .option('t', {
              alias: 'tls',
              default: false,
              describe: 'Enable TLS security for the REST API',
              type: 'boolean'
            })
            .option('c', {
              alias: 'tlscert',
              describe: 'File containing the TLS certificate',
              default: path.join(__dirname, './private/certificate.pem'),
              type: 'string'
            })
            .option('k', {
              alias: 'tlskey',
              describe: 'File containing the TLS private key',
              default: path.join(__dirname, './private/privatekey.pem'),
              type: 'string'
            })
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

var app = module.exports = loopback();
var passportConfigurator = new PassportConfigurator(app);

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

  // Read providers.json file if it exists, or revert to no security
  var passportConfig = {};
  try {
    passportConfig = require('./providers.json');
    app.enableAuth();
  } catch (err) {
    console.log("Warning: no authentication enabled.");
  }

  for (var s in passportConfig) {
    var c = passportConfig[s];
    c.session = c.session !== false;
    passportConfigurator.configureProvider(s, c);
  }
  var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

  app.get('/', function(req, res, next) {
    res.redirect('/explorer');
  });

  app.get('/auth/logout', function (req, res, next) {
    return Promise.resolve()
      .then(() => {
        if (req.accessToken) {
          return app.models.user.logout(req.accessToken.id);
        }
      })
      .then(() => {
        req.logout();
        res.clearCookie('access_token');
        res.clearCookie('userId');
        res.redirect('/explorer');
      });
  });    

  var port =( argv.port === undefined ? app.get('port') : argv.port);
  if ( isNaN(port) || port < 0 || port > 65535 ) {
    console.log("ERROR: 'port' must be in the range 0 to 65535");
    return;
  }

  var server = null;
  if (argv.tls) {
    var options = { };

    // Get key for server to run TLS
    try{
      options.key = fs.readFileSync(argv.tlskey).toString();
    } catch (err) {
      if(err.code == 'ENOENT'){
        console.log("ERROR: 'tlskey' not found \"" + argv.tlskey + "\"");
        return;
      } else {
        throw err;
      }
    }

    // Get certificate for server to run TLS
    try{
      options.cert = fs.readFileSync(argv.tlscert).toString();
    } catch (err) {
      if(err.code == 'ENOENT'){
        console.log("ERROR: 'tlscert' not found \"" + argv.tlscert + "\"");
        return;
      } else {
        throw err;
      }
    }

    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
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
