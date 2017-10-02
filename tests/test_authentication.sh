#!/usr/bin/env bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Test various authentication mechanisms
#
# Basic methodology is to start the SDK REST server, GET /channels,
# and check it doesn't resolve. Authenticate via the particular
# mechanism we're testing, and then issue the GET request again,
# confirming we see what we expect.



# Test that HTTP Basic Auth works
#
# Ensure that the providers file doesn't exist before we start the
# test.



# Test that LDAP Authentication works
#
# 1. Start the ldapjs server
# 2. Ensure the providers file exists, and not just the template

providers_file="../packages/fabric-rest/server/providers.json"

node ./authentication/authentication.js &
sleep 3 # Just to be sure

if [[ ! -f "$providers_file" ]]; then
    cp "{providers_file}.template" "$providers_file"
fi

# Get the channels, which should fail
curl -X GET --header 'Accept: application/json' 'http://0.0.0.0:3000/api/fabric/1_0/channels' | grep Error
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected "
fi

# Authenticate with an incorrect password, which should fail
curl -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=alice&password=wrongsecret' 'http://0.0.0.0:3000/auth/ldap'

# Get the channels, which should fail

# Authenticate with a correct password, which should pass
curl -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=alice&password=secret' 'http://0.0.0.0:3000/auth/ldap'

# Get the channels, which should now work
