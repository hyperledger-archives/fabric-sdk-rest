#!/usr/bin/env bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

#
# Test that LDAP Authentication works
#

providers_file="../packages/fabric-rest/server/providers.json"
cookies_file="cookies.txt"
log_file="auth_test.log"
failed_tests=0
port=3000

_show_help() {
    printf -- "Usage: test_authentication.sh [OPTIONS]\n\n"
    printf -- "Options:\n"
    printf -- "-p specify a port to connect to the Fabric SDK REST server on (default: 3000)\n"
    exit 12
}

while getopts :p:h opt; do
    case "$opt" in
        p)    port="$OPTARG"
              ;;
        h)    _show_help
              ;;
        '?')  printf -- "Invalid option $OPTARG. Try '-h' for help.\n" && exit 12
              ;;
    esac
done

shift $((OPTIND-1))

# Get the channels, which should fail (JSON payload, error.statusCode=401,
# error.message='Authorization Required')
curl -s -X GET -H 'Accept: application/json' "http://0.0.0.0:${port}/api/fabric/1_0/channels" -o "$log_file"
grep 'Authorization Required' "$log_file"
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to find not-auth error, but didn't\n"
    ((failed_tests++))
    printf "DEBUG: ${failed_tests}\n"
fi

# Authenticate with an incorrect password, which should fail
curl -s -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=alice&password=wrongsecret' "http://0.0.0.0:${port}/auth/ldap" -o "$log_file"
grep 'Redirecting to /failure' "$log_file"
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to fail auth\n"
    ((failed_tests++))
    printf "DEBUG: ${failed_tests}\n"
fi

# Get the channels, which should fail
curl -s -b "$cookies_file" -X GET --header 'Accept: application/json' "http://0.0.0.0:${port}/api/fabric/1_0/channels" -o "$log_file"
grep 'Authorization Required' "$log_file"
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to find not-auth error, but didn't\n"
    ((failed_tests++))
    printf "DEBUG: ${failed_tests}\n"
fi

# Authenticate with a correct password, which should pass
curl -s -c "$cookies_file" -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=alice&password=secret' "http://0.0.0.0:${port}/auth/ldap" -o "$log_file"
grep 'Redirecting to /explorer' "$log_file"
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to succeed in auth\n"
    ((failed_tests++))
    printf "DEBUG: ${failed_tests}\n"
fi

# Get the channels, which should now work
curl -s -b "$cookies_file" -X GET --header 'Accept: application/json' "http://0.0.0.0:${port}/api/fabric/1_0/channels" -o "$log_file"
grep mychannel "$log_file"
if [[ ! $? -eq 0 ]]; then # Error response was found
    printf "Expected to find channel name\n"
    ((failed_tests++))
    printf "DEBUG: ${failed_tests}\n"
fi


#
# Clean up
#


if [[ -f "$cookies_file" ]]; then
    printf "Removing cookies file\n" && rm "$cookies_file"
fi

if [[ -f "$log_file" ]]; then
    printf "Removing log file\n" && rm "$log_file"
fi

exit ${failed_tests}
