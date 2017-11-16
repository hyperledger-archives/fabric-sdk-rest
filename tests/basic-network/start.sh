#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

# Based on fabric-samples/basic-network
#echo "FABRIC_SAMPLES_DIR: ${FABRIC_SAMPLES_DIR}"

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

docker-compose -f $( dirname "${BASH_SOURCE[0]}" )/docker-compose.yml down

docker-compose -f $( dirname "${BASH_SOURCE[0]}" )/docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com couchdb peer1.org1.example.com couchdbPeer1

# # wait for Hyperledger Fabric to start
# # incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
# export FABRIC_START_TIMEOUT=10
# #echo ${FABRIC_START_TIMEOUT}
# sleep ${FABRIC_START_TIMEOUT}
