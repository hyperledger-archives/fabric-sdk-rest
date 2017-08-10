# Fabric Rest
#
# Thin wrapper around the Fabric REST API.


# Copyright 2017 IBM All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


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
    def create_channel(self):
        """Create the named channel"""
        pass


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
    def init_new_chaincode(self):
        """Instantiate new chaincode in the channel for the named peers"""
        pass


    # GET /fabric/1_0/channels/{channelName}/chaincodes/{id}
    def query_channel_chaincode(self):
        """Query chaincode instantiated on a channel by ID"""
        pass


    # POST /fabric/1_0/channels/{channelName}/endorse
    def send_proposal(self):
        """Send a proposal to the channel's peers. This could be for either chaincode or a transaction."""
        pass


    # POST /fabric/1_0/channels/{channelName}/ledger
    def query_ledger(self, channel, data, chaincode_id=None, block_id=None, block_hash=None, txn_id=None):
        """Query the channel's ledger.

        Query the /ledger endpoint for a given channel, passing data for the query, and any
        optional identifiers.
        """
        url = "/api/fabric/1_0/channels/" + channel + "/ledger?"
        if chaincode_id:
            url += "chaincodeId=" + chaincode_id
        return self._call_endpoint("POST", url, data)


    # POST /fabric/1_0/channels/{channelName}/peers
    def join_channel(self):
        """Join a Peer to the channel"""
        pass


    # POST /fabric/1_0/channels/{channelName}/transactions
    def commit_transaction(self):
        """Commit a transaction, if no proposal responses propose and commit."""
        pass


    # GET /fabric/1_0/channels/{channelName}/transactions/{transactionID}
    def query_transaction(self):
        """Query a transaction on a channel by ID"""
        pass
