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

docker-compose -f $( dirname "${BASH_SOURCE[0]}" )/docker-compose-tls.yml down

docker-compose -f $( dirname "${BASH_SOURCE[0]}" )/docker-compose-tls.yml up -d ca.example.com orderer.example.com peer0.org1.example.com couchdb peer1.org1.example.com couchdbPeer1
