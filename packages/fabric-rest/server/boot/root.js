'use strict';

var passport = require('passport');

module.exports = function(server) {
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(passport.authenticate('basic', { session: false }),
             router);
};
