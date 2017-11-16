#!/bin/bash -
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#


#
# Setup
#


project_dir="$(cd "$( dirname "${BASH_SOURCE[0]}" )/../../" && pwd)/fabric-sdk-rest"
server_dir="${project_dir}/packages/fabric-rest"
tests_dir="${project_dir}/tests"
cookies_file="cookies.txt"

cd "${server_dir}/server"
mkdir -p private
cd private
if [[ ! -f privatekey.pem ]]; then
    openssl req -x509 -newkey rsa:4096 -keyout privatekey.pem -out certificate.pem \
            -days 365 -subj "/C=US/ST=Oregon/L=Portland/O=Company Name/OU=Org/CN=www.example.com" -nodes
fi

# Stop any currently-running Hyperledger Docker containers
# echo "Stopping any running Hyperledger Docker containers"
#docker ps -a | grep -i hyperledger | cut -d' ' -f1 | xargs docker rm -f

# Need to be in basic-network folder for docker-compose to pick up .env file
cd "${tests_dir}/basic-network"
# Start fabric sample basic-network in "extra basic" Model
./start.sh

# Get user keys from crypto-config used with tests
cd "${tests_dir}/basic-network/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"
privatekeyUser="$(ls *_sk)"
cd "${tests_dir}/basic-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
privatekeyAdmin="$(ls *_sk)"

# Update datasources.json to use crypto-config from tests directory and run as Fabric ADMIN
# TODO consider adding tests to run as a Fabric user.
cd "${server_dir}/server"
printf "TEST - privatekeyUser  : ${privatekeyUser}\n"
printf "TEST - privatekeyAdmin : ${privatekeyAdmin}\n"
sed -e "s/ADMINUSER/fabricUser/" -e "s^XXXXXXXX^${privatekeyUser}^" -e "s^ADMIN1STORE^${privatekeyAdmin}^" \
    -e "s^FABSAMPLE^${tests_dir}/basic-network^" < datasources.json.template > datasources.json

# Start the LDAP server
cd "${tests_dir}"
node ./authentication/authentication.js &
ldapjs_pid=$!
printf "Starting LDAP server, PID: ${ldapjs_pid}\n"
sleep 3

# Start the REST server in its own process with debug on
cd "${server_dir}"
node . --hfc-logging "{\"info\":\"${tests_dir}/logs/fullRun_$(date +%s).log\",\"debug\":\"${tests_dir}/logs/fullRun_$(date +%s).log\"}" &
# Save server's process id
rest_server_pid=$!
printf "Starting REST server, PID: ${rest_server_pid}\n"

# Give the server a chance to start
printf "Sleeping for 10s to allow the REST server and Fabric network to start up\n"
sleep 10


#
# Test suite 1
#


# Now run the channel setup and fabcar tests
cd "${tests_dir}"
python ./test_channel_setup.py
if [[ $? -eq 0 ]]; then # Error response was found
  result_test1="PASSED"
else
  result_test1="FAILED"
fi


#
# Test suite 2
#


# Allow time for fabcar to be initialized before running tests
printf "Wait 5 seconds to allow fabcar to finish initializing\n"
sleep 5
python ./test_fabcar.py
if [[ $? -eq 0 ]]; then # Error response was found
  result_test2="PASSED"
else
  result_test2="FAILED"
fi


#
# Test suite 3
#


# Set up NODE_PATH to be able to start ldap server and run auth tests
export NODE_PATH=../packages/fabric-rest/node_modules
./test_authentication.sh
if [[ $? -eq 0 ]]; then # Error response was found
  result_test3="PASSED"
else
  result_test3="FAILED"
fi


#
# Switch the REST SDK server from HTTP to HTTPS configuration
#


# Stop the REST server
printf "Switching REST SDK server to use TLS\n"
printf "Stopping REST SDK server, PID: ${rest_server_pid}\n"
kill -15 ${rest_server_pid}
printf "Wait 3 seconds to allow REST server to stop\n"
sleep 3

cd "${server_dir}"
# Start the REST server in it's own process with tls and debug on
node . --tls --hfc-logging "{\"info\":\"${tests_dir}/logs/fullRun_$(date +%s).log\",\"debug\":\"${tests_dir}/logs/fullRun_$(date +%s).log\"}" &
# Save server's process id
rest_server_pid=$!
printf "Starting REST server with TLS on, PID: ${rest_server_pid}\n"
printf "Wait 5 seconds to allow REST server to start up\n"
sleep 5


#
# Test suite 4
#


# Now run the fabcar tests again with TLS option specified
cd "${tests_dir}"
python ./test_fabcar.py -t
if [[ $? -eq 0 ]]; then # Error response was found
  result_test4="PASSED"
else
  result_test4="FAILED"
fi

# Stop the REST and LDAP servers
printf "Stopping REST SDK server, PID: ${rest_server_pid}\n"
kill -15 "$rest_server_pid"
printf "Stopping LDAP server, PID: ${ldapjs_pid}\n"
kill -2 "$ldapjs_pid"

cd "${tests_dir}"
if [[ -f "$cookies_file" ]]; then
    rm "$cookies_file"
fi

# cd ${tests_dir}/basic-network
# # Stop the network
# ./stop.sh

printf "\nTest suite result summary\n\n"
printf "Test suite 1:  ${result_test1}\n"
printf "Test suite 2:  ${result_test2}\n"
printf "Test suite 3:  ${result_test3}\n"
printf "Test suite 4:  ${result_test4}\n"
