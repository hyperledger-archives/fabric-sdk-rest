#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -e

# Shut down the Docker containers for the system tests.
docker-compose -f $( dirname "${BASH_SOURCE[0]}" )/docker-compose.yml kill && docker-compose -f $( dirname "${BASH_SOURCE[0]}" )/docker-compose.yml down

# remove the local state
rm -f ~/.hfc-key-store/*

# remove chaincode docker images
docker rmi $(docker images dev-* -q)

# Your system is now clean
