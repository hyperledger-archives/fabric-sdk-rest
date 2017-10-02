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
ldapjs_pid=$!
sleep 3 # Just to be sure

if [[ -f cookies.txt ]]; then
    rm cookies.txt
fi

if [[ ! -f "$providers_file" ]]; then
    cp "{providers_file}.template" "$providers_file"
fi

# Get the channels, which should fail (JSON payload, error.statusCode=401,
# error.message='Authorization Required')
curl -X GET -H 'Accept: application/json' 'http://0.0.0.0:3000/api/fabric/1_0/channels' | grep 'Authorization Required'
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to find not-auth error, but didn't"
fi

# Authenticate with an incorrect password, which should fail
curl -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=alice&password=wrongsecret' 'http://0.0.0.0:3000/auth/ldap' | grep 'Redirecting to /failure'
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to fail auth"
fi

# Get the channels, which should fail
curl -b cookies.txt -X GET --header 'Accept: application/json' 'http://0.0.0.0:3000/api/fabric/1_0/channels' | grep 'Authorization Required'
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to find not-auth error, but didn't"
fi

# Authenticate with a correct password, which should pass
curl -c cookies.txt -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=alice&password=secret' 'http://0.0.0.0:3000/auth/ldap' | grep 'Redirecting to /explorer'
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to succeed in auth"
fi

# Get the channels, which should now work
curl -b cookies.txt -X GET --header 'Accept: application/json' 'http://0.0.0.0:3000/api/fabric/1_0/channels' | grep mychannel
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to find channel name"
fi

kill $ldapjs_pid
