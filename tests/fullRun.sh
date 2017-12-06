#!/bin/bash -
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#


# Run all the Fabric SDK REST server tests
#
# 1. Start the Fabric network
# 2. Setup the server
# 3. Start the LDAP server for authentication testing
# 4. Start the Fabric SDK REST server
# 5. Run all tests
# 6. Stop the Fabric SDK REST server, and LDAP server
# 7. Clean up


project_dir="$(cd "$( dirname "${BASH_SOURCE[0]}" )/../../" && pwd)/fabric-sdk-rest"
server_dir="${project_dir}/packages/fabric-rest"
tests_dir="${project_dir}/tests"
providers_file="${server_dir}/server/providers.json"
cookies_file="cookies.txt"
port=3000

_show_help() {
    printf -- "Usage: fullRun.sh [OPTIONS]\n\n"
    printf -- "Options:\n"
    printf -- "-f force removal of 'hyperledger' Docker containers\n"
    printf -- "-k don't kill the LDAP server or Fabric REST server\n"
    printf -- "-p specify a port for the Fabric SDK REST server to listen on (default: 3000)\n"
    exit 12
}

while getopts :fkp:h opt; do
    case "$opt" in
        f)    force_remove_docker=true
              ;;
        k)    no_kill=true
              ;;
        p)    port="$OPTARG"
              ;;
        h)    _show_help
              ;;
        '?')  printf -- "Invalid option $OPTARG. Try '-h' for help.\n" && exit 12
              ;;
    esac
done

shift $((OPTIND-1))

# Start Fabric SDK REST server
#
# First argument allows for TLS to be used:
# _start_fabric_rest_server -t
_start_fabric_rest_server() {
    cd "${server_dir}"
    ./fabric-rest-server -p "$port" -l "{\"info\":\"${tests_dir}/logs/fullRun_$(date +%s).log\",\"debug\":\"${tests_dir}/logs/fullRun_$(date +%s).log\"}" $1
    # Save server's process id
    rest_server_pid=$(</tmp/.fabric-rest-server.pid)
    printf "Starting REST server, PID: ${rest_server_pid}\n"
    # Give the server a chance to start
    printf "Sleeping for 10s to allow the REST server and Fabric network to start up\n"
    sleep 10
}

# Kill the Fabric SDK REST server
_kill_fabric_rest_server() {
    printf "Stopping REST SDK server, PID: ${rest_server_pid}\n"
    kill -2 ${rest_server_pid}
    printf "Wait 3 seconds to allow REST server to stop\n"
    sleep 3
}


# If a providers.json file is already there, save it for later: could
# have been created by the user
if [[ -f "$providers_file" ]]; then
    printf "Saving existing providers.json file to restore later\n"
    mv "$providers_file" "${providers_file}.saved"
fi


#
# Start the Fabric network
#


# Stop any currently-running Hyperledger Docker containers
if [[ -n $force_remove_docker ]]; then
    echo "Stopping any running Hyperledger Docker containers"
    docker ps -a | grep -i hyperledger | cut -d' ' -f1 | xargs docker rm -f
fi

# Need to be in basic-network folder for docker-compose to pick up .env file
cd "${tests_dir}/basic-network"
# Start fabric sample basic-network in "extra basic" Model
./start.sh


#
# Setup the server
#

printf "Setting up Fabric REST server with TLS keys\n"
"${project_dir}/setup.sh" -tukaf "${tests_dir}/basic-network"


#
# Start the LDAP server for authentication testing
#


cd "${tests_dir}"
node ./authentication/authentication.js &
ldapjs_pid=$!
printf "Starting LDAP server, PID: ${ldapjs_pid}\n"
sleep 3


#
# Start the Fabric SDK REST server
#


_start_fabric_rest_server


#
# Run all tests
#


cd "${tests_dir}"


#
# Test suite 1
# Run the channel setup and fabcar tests
#


python ./test_channel_setup.py -p "$port"
if [[ $? -eq 0 ]]; then # Error response was found
  result_test1="PASSED"
else
  result_test1="FAILED"
fi


#
# Test suite 2
# Test the fabcar network
#


printf "Wait 5 seconds to allow fabcar to finish initializing\n"
sleep 5
python ./test_fabcar.py -p "$port"
if [[ $? -eq 0 ]]; then # Error response was found
  result_test2="PASSED"
else
  result_test2="FAILED"
fi


#
# Test suite 3
# Switch the REST SDK server from no auth to LDAP authentication
#


# Stop the REST server
_kill_fabric_rest_server

# Ensure the providers file exists, and not just the template
cd "${server_dir}"
if [[ ! -f "$providers_file" && -f "${providers_file}.template" ]]; then
    printf "Creating providers file from template for LDAP authentication\n"
    cp "${providers_file}.template" "$providers_file"
else
    printf "Exiting: no providers.json file (or its original template) found in fabric-rest/server directory\n"
    exit 1
fi

printf "Starting Fabric REST server with LDAP authentication configured\n"
_start_fabric_rest_server

# Set up NODE_PATH to be able to start ldap server and run auth tests
export NODE_PATH=../packages/fabric-rest/node_modules
cd "${tests_dir}"
./test_authentication.sh -p "$port"
if [[ $? -eq 0 ]]; then # Error response was found
  result_test3="PASSED"
else
  result_test3="FAILED"
fi


# Remove the providers file if it exists
if [[ -f "$providers_file" ]]; then
    printf "Removing providers file\n"
    rm "$providers_file"
fi


#
# Switch the REST SDK server from HTTP to HTTPS configuration
#


# Stop the REST server
printf "Switching REST SDK server to use TLS\n"
_kill_fabric_rest_server
_start_fabric_rest_server -t


#
# Test suite 4
#


# Now run the fabcar tests again with TLS option specified
cd "${tests_dir}"
python ./test_fabcar.py -t -p "$port"
if [[ $? -eq 0 ]]; then # Error response was found
  result_test4="PASSED"
else
  result_test4="FAILED"
fi


#
# Stop the Fabric SDK REST server, and LDAP server
#


# Stop the REST and LDAP servers
if [[ -n $no_kill ]]; then
    printf "Fabric REST server (with TLS enabled) and LDAP server still alive.\nIssue commands to kill them:\n\n"
    printf "kill -2 $rest_server_pid # Fabric REST server\n"
    printf "kill -2 $ldapjs_pid # LDAP server\n"
else
    printf "Stopping REST SDK server, PID: ${rest_server_pid}\n"
    kill -2 "$rest_server_pid"
    printf "Stopping LDAP server, PID: ${ldapjs_pid}\n"
    kill -2 "$ldapjs_pid"
fi

sleep 1
printf "\nFabric network container summary\n\n"
# Show containers running in network, so easier to spot network's version
docker ps --format "table {{.Names}}\t{{.Image}}"

# cd ${tests_dir}/basic-network
# # Stop the network
# ./stop.sh

printf "\nTest suite result summary\n\n"
printf "Test suite 1:  ${result_test1}\n"
printf "Test suite 2:  ${result_test2}\n"
printf "Test suite 3:  ${result_test3}\n"
printf "Test suite 4:  ${result_test4}\n"


#
# Clean up
#


cd "${tests_dir}"
if [[ -f "$cookies_file" ]]; then
    rm "$cookies_file"
fi

if [[ -f "${providers_file}.saved" ]]; then
    printf "Restoring saved providers.json file\n"
    mv "${providers_file}.saved" "$providers_file"
fi
