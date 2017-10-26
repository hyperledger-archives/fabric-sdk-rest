#!/bin/bash -
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

project_dir="$(cd "$( dirname "${BASH_SOURCE[0]}" )/../../" && pwd)/fabric-sdk-rest"
server_dir=${project_dir}/packages/fabric-rest
tests_dir=${project_dir}/tests

# Need to be in basic-network folder for docker-compose to pick up .env file
cd ${tests_dir}/basic-network
# Start fabric sample basic-network in "extra basic" Model
./start.sh

# Get user keys from crypto-config used with tests
cd "${tests_dir}/basic-network/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"
privatekeyUser="$(ls *_sk)"
cd "${tests_dir}/basic-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
privatekeyAdmin="$(ls *_sk)"

# Update datasources.json to use crypto-config from tests directory and run as Fabric ADMIN
# TODO consider adding tests to run as a Fabric user.
cd ${server_dir}/server
echo "TEST - privatekeyUser  : ${privatekeyUser}"
echo "TEST - privatekeyAdmin : ${privatekeyAdmin}"
sed -e "s/ADMINUSER/fabricUser/" -e "s^XXXXXXXX^${privatekeyUser}^" -e "s^ADMIN1STORE^${privatekeyAdmin}^" \
    -e "s^FABSAMPLE^${tests_dir}/basic-network^" < datasources.json.template > datasources.json

# Start the REST server in it's own process with debug on
cd ${server_dir}
node . --hfc-logging "{\"info\":\"${tests_dir}/logs/fullRun_$(date +%s).log\",\"debug\":\"${tests_dir}/logs/fullRun_$(date +%s).log\"}" &
# Save server's process id
SERVER_PID=$!
echo "Starting REST server, PID: ${SERVER_PID}"

# Give the server a chance to start
echo "Sleeping for 10s to allow the REST server and Fabric network to start up"
sleep 10

# Now run the channel setup and fabcar tests
cd ${tests_dir}
python ./test_channel_setup.py
result_test1=$?

# Allow time for fabcar to be initialized before running tests
sleep 5
python ./test_fabcar.py
result_test2=$?

# Set up NODE_PATH to be able to start ldap server and run auth tests
export NODE_PATH=../packages/fabric-rest/node_modules
./test_authentication.sh
result_test3=$?

# Stop the REST server
echo "Stopping REST SDK server, PID: ${SERVER_PID}"
kill -15 ${SERVER_PID}

# cd ${server_dir}
# # Start the REST server in it's own process with tls and debug on
# node . --tls --hfc-logging '{"debug":"console"}' &
# # Save server's process id
# SERVER_PID=$!
# echo "Started REST server with TLS on, PID: ${SERVER_PID}"
#
# # Now run the authentication and fabcar tests
# # TODO add fabcar tests
# # TODO add authentication tests
#
# # Stop the REST server
# kill -15 ${SERVER_PID}

# cd ${tests_dir}/basic-network
# # Stop the network
# ./stop.sh

#TODO Make sure scripts return a failure RC
echo ""
echo "*CHECK* Test suite 1, RC= ${result_test1}"
echo "*CHECK* Test suite 2, RC= ${result_test2}"
echo "Test suite 3, Failed tests= ${result_test3}"
