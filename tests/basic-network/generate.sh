#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This assumes that fabric-samples are cloned to the same root folder as this project
export FABRIC_SAMPLES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../../../" && pwd)/fabric-samples"
export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${FABRIC_SAMPLES_DIR}/bin:$PATH
export FABRIC_CFG_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
#export FABRIC_CFG_PATH=.
CHANNEL_NAME=mychannel

basicNetworkDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"

echo "FABRIC_SAMPLES_DIR: ${FABRIC_SAMPLES_DIR}"

# remove previous crypto material and config transactions
rm -fr ${basicNetworkDir}/config/*
rm -fr ${basicNetworkDir}/crypto-config/*

# generate crypto material
cryptogen generate --config=${basicNetworkDir}/crypto-config.yaml --output="${basicNetworkDir}/crypto-config"
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# generate genesis block for orderer
configtxgen -profile OneOrgOrdererGenesis -outputBlock ${basicNetworkDir}/config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile OneOrgChannel -outputCreateChannelTx ${basicNetworkDir}/config/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction
configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ${basicNetworkDir}/config/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi
