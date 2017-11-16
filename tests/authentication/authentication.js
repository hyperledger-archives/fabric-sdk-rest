//
// Copyright IBM Corp. All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//

// ldapsearch -x -D "dc=example,dc=org" -W -H ldap://0.0.0.0:1389 -b "dc=example,dc=org" -s sub 'uid=alice'

'use strict';

const port=1389;
const ldapserver = require('./ldapserver');
const password='secret';

console.log('Starting LDAP server');
ldapserver.start(port, password);
console.log('LDAP server started, listening on port ' + port);
