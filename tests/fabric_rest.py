#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Fabric Rest
#
# Thin wrapper around the Fabric REST API.

import json
import subprocess


class FabricRest:
    """A thin wrapper around the Fabric REST API."""


    def __init__(self, h="localhost", p="3000"):
        self.hostname=h
        self.port=p


    def _call_endpoint(self, verb, endpoint, data=None):
        """Call a REST endpoint, returning a dict representation of the returned JSON."""
        url = "http://" + self.hostname + ":" + self.port + endpoint
        process_list = ["curl", "-u", "chris:secret", "-s", "-X", verb.upper(), "--header", "Accept: application/json",
                        "--header", "Content-Type: application/json"]

        if data:
            process_list.extend(["-d", data])
        process_list.append(url)
        return json.loads(subprocess.check_output(process_list))


    # GET /fabric/1_0/channels
    def get_channels(self):
        """Get the names of known channels from the primary peer"""
        return self._call_endpoint("GET", "/api/fabric/1_0/channels")

    # POST /fabric/1_0/chaincodes
    def install_chaincode(self, chaincode_id, chaincode_path, archive_bytes, chaincode_version, peers):
        """Install chaincode onto the named peers"""
        url = "/api/fabric/1_0/chaincodes?"
        if peers:
            url += "peers=" + peers
        data='{"chaincodeId":"'+chaincode_id+'","chaincodePath":"'+ chaincode_path+'","chaincodePackage":"'+ archive_bytes+'","chaincodeVersion":"'+ chaincode_version+'"}'
        return self._call_endpoint("POST", url, data)

    # POST /fabric/1_0/chaincodes
    def install_chaincode_file(self, chaincode_id, chaincode_path, chaincode_version, peers):
        """Install chaincode onto the named peers"""
        url = "/api/fabric/1_0/chaincodes?"
        if peers:
            url += "peers=" + peers
        data='{"chaincodeId":"'+chaincode_id+'","chaincodePath":"'+ chaincode_path+'","chaincodeVersion":"'+ chaincode_version+'"}'
        return self._call_endpoint("POST", url, data)

    # GET /fabric/1_0/chaincodes/{id}
    def query_chaincode(self, chaincode_id, peers):
        """Query chaincode installed on a peer by ID"""
        url = "/api/fabric/1_0/chaincodes/" + chaincode_id + "?"
        if peers:
            url += "peers=" + peers
        return self._call_endpoint("GET", url)


    # GET /fabric/1_0/channels/{channelName}
    def get_channel_info(self):
        """Get information about the named channel"""
        pass


    # PUT /fabric/1_0/channels/{channelName}
    def update_channel(self):
        """Update the named channel"""
        pass


    # POST /fabric/1_0/channels/{channelName}
    def create_channel(self, channel_name, channel_config_base64):
        """Create a channel"""
        url = "/api/fabric/1_0/channels/" +channel_name
        data='{"envelope":"'+channel_config_base64+'"}'  #No signatures passed in as one org test
        return self._call_endpoint("POST", url, data)


    # GET /fabric/1_0/channels/{channelName}/blocks
    def query_block(self):
        """Query a block on a channel by ID or Hash"""
        pass


    # GET /fabric/1_0/channels/{channelName}/chaincodes
    def query_all_chaincode(self):
        """Query all chaincode instantiated on the channel"""
        pass


    # PUT /fabric/1_0/channels/{channelName}/chaincodes
    def init_updated_chaincode(self):
        """Instantiate updated chaincode in the channel for the named peers"""
        pass


    # POST /fabric/1_0/channels/{channelName}/chaincodes
    def instantiate_chaincode(self,channel_name,chaincode_id,chaincode_version):
        """Instantiate new chaincode in the channel for the named peers"""
        url = "/api/fabric/1_0/channels/" +channel_name+ "/chaincodes?peers=%5B0%5D"
        data='{"chaincodeId":"'+chaincode_id+'","chaincodeVersion":"'+chaincode_version+'"}'
        return self._call_endpoint("POST", url, data)


    # GET /fabric/1_0/channels/{channelName}/chaincodes/{id}
    def query_channel_chaincode(self):
        """Query chaincode instantiated on a channel by ID"""
        pass


    # POST /fabric/1_0/channels/{channelName}/endorse
    def send_proposal(self):
        """Send a proposal to the channel's peers. This could be for either chaincode or a transaction."""
        pass


    # POST /fabric/1_0/channels/{channelName}/ledger
    def query_ledger(self, channel, data=None, chaincode_id=None, block_id=None, block_hash=None, txn_id=None):
        """Query the channel's ledger.

        Query the /ledger endpoint for a given channel, passing data for the query, and any
        optional identifiers.
        """
        url = "/api/fabric/1_0/channels/" + channel + "/ledger?"
        if chaincode_id:
            url += "chaincodeId=" + chaincode_id
        if block_id:
            url += "blockId=" + block_id
        if block_hash:
            url += "blockHash=" + block_hash
        if txn_id:
            url += "txnId=" + txn_id
        return self._call_endpoint("POST", url, data)


    # POST /fabric/1_0/channels/{channelName}/peers
    def join_channel(self, channel_name, peer_data):
        """Join a channel"""
        url = "/api/fabric/1_0/channels/" +channel_name +"/peers"
        return self._call_endpoint("POST", url, peer_data)

    # POST /fabric/1_0/channels/{channelName}/transactions
    def commit_transaction(self,channel,data):
        """Commit a transaction, if no proposal responses propose and commit."""
        url = "/api/fabric/1_0/channels/" + channel + "/transactions"
        return self._call_endpoint("POST", url, data)


    # GET /fabric/1_0/channels/{channelName}/transactions/{transactionID}
    def query_transaction(self):
        """Query a transaction on a channel by ID"""
        pass
