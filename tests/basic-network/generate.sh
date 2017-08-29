#!/bin/sh
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${FABRIC_SAMPLES_DIR}/bin:${FABRIC_SAMPLES_DIR}/basic-network:$PATH
export FABRIC_CFG_PATH=${FABRIC_SAMPLES_DIR}/basic-network
CHANNEL_NAME=mychannel

echo "FABRIC_SAMPLES_DIR: ${FABRIC_SAMPLES_DIR}"

# remove previous crypto material and config transactions
rm -fr ${FABRIC_SAMPLES_DIR}/basic-network/config/*
rm -fr ${FABRIC_SAMPLES_DIR}/basic-network/crypto-config/*

# generate crypto material
cryptogen generate --config=./crypto-config.yaml --output="${FABRIC_SAMPLES_DIR}/basic-network/crypto-config"
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# generate genesis block for orderer
configtxgen -profile OneOrgOrdererGenesis -outputBlock ${FABRIC_SAMPLES_DIR}/basic-network/config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile OneOrgChannel -outputCreateChannelTx ${FABRIC_SAMPLES_DIR}/basic-network/config/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction
configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ${FABRIC_SAMPLES_DIR}/basic-network/config/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi
