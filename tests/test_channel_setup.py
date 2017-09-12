# Test Fabcar Sample
#
# Basic tests to confirm that REST calls into the Fabcar sample network work.


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


from sys import argv
from fabric_rest import FabricRest
import base64
import os
import time
import unittest


class TestChannelSetup(unittest.TestCase):
    #This test suite requires that channel.tx has been generated for the basic-network sample

    def test_aa_create_channel(self):
        """Test creating the channel mychannel, just tests orderer has accepted the request"""
        # Get fabric sample directory, default assumes fabric-samples checked
        # out into same root folder as this project
        fs_dir = os.getenv('FABRIC_SAMPLES_DIR','../../fabric-samples')
        config_file_loc = fs_dir + '/basic-network/config/channel.tx'
        config_file = open(config_file_loc, 'rb')
        configInb64 = base64.b64encode(config_file.read())
        config_file.close()
        create_result = restserver.create_channel("mychannel",configInb64)["status"]
        self.assertEqual(create_result,"SUCCESS")
        time.sleep(5) #Allow orderer to finish this task before next tests run

    def test_ab_join_channel(self):
        """Test joining peer0 to the new channel"""
        # Get fabric sample directory, default assumes fabric-samples checked
        # out into same root folder as this project
        fs_dir = os.getenv('FABRIC_SAMPLES_DIR','../../fabric-samples')
        pem_file_loc = fs_dir + '/basic-network/crypto-config/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem'
        pem_file = open(pem_file_loc, 'rb')
        #READ in PEM
        pem_for_peer = pem_file.read()
        pem_for_peer = pem_for_peer.replace('\n','') #Strip newline chars from PEM.
        peerData = "{\"url\": \"grpc://0.0.0.0:7051\",\"opts\":{\"pem\":\""+ pem_for_peer +"\",\"ssl-target-name-override\": \"peer0\"}}"
        pem_file.close()
        join_result = restserver.join_channel("mychannel",peerData)["peerResponses"]["response"]["status"]
        self.assertEqual(join_result,200)

    def test_ac_chaincode_install_marbles02(self):
        """Test to confirm that installing chaincode on a peer works."""
        # install chaincode: id, path(in archive), archive as base64 string, version, peers
        archiveFile = open('input/installTest.tar.gz', 'rb')
        archiveInb64 = base64.b64encode(archiveFile.read())
        archiveFile.close()
        install_result = restserver.install_chaincode("marbles","marbles02",archiveInb64,"1.0","%5B0%5D")["peerResponses"]
        #TODO check response

    def test_ad_chaincode_install_fabcar(self):
        """Test to confirm that installing fabcar chaincode on a peer works."""
        # install chaincode: id, path(in archive), archive as base64 string, version, peers
        # Created using "tar -cvzf installFabcar.tar.gz src/fabcar/fabcar.go"
        archiveFile = open('input/installFabcar.tar.gz', 'rb')
        archiveInb64 = base64.b64encode(archiveFile.read())
        archiveFile.close()
        install_result = restserver.install_chaincode("fabcar","fabcar",archiveInb64,"1.0","%5B0%5D")["peerResponses"]
        time.sleep(5) # Allow chaincode install to complete
        #TODO check response

    def test_ae_chaincode_instantiate_fabcar(self):
        """Test to confirm that instantiating fabcar chaincode on a channel works."""
        instantiate_result = restserver.instantiate_chaincode("mychannel","fabcar","1.0")["status"]
        self.assertEqual(instantiate_result,"SUCCESS")
        time.sleep(5) # Allow chaincode instantiate to complete before using it

    def test_af_initialize_fabcar(self):
        """Test to initialize the ledger with fabcar data."""
        init_result = restserver.commit_transaction("mychannel",
                                            data=r'{"proposal":{"chaincodeId":"fabcar","fcn":"initLedger","args":[""]}}')
        #TODO check response

# TODO Failing with "Rejecting CONFIG_UPDATE because: Error authorizing update: Update not for correct channel:"
    # def test_ag_update_channel(self):
    #     """Test updating the channel mychannel, just tests orderer has accepted the request"""
    #     # Get fabric sample directory, default assumes fabric-samples checked
    #     # out into same root folder as this project
    #     fs_dir = os.getenv('FABRIC_SAMPLES_DIR','../../fabric-samples')
    #     config_file_loc = fs_dir + '/basic-network/config/Org1MSPanchors.tx'
    #     config_file = open(config_file_loc, 'rb')
    #     configInb64 = base64.b64encode(config_file.read())
    #     config_file.close()
    #     create_result = restserver.update_channel("mychannel",configInb64)["status"]
    #     self.assertEqual(create_result,"SUCCESS")
    #     time.sleep(3) #Allow orderer to finish this task before next tests run

    # def test_first_channel_name(self):
    #     """Test to confirm that the first channel on the network has the default name of
    #     mychannel.
    #     """
    #     first_channel = restserver.get_channels()["channels"][0]["channel_id"]
    #     self.assertEqual(first_channel, "mychannel")

if __name__ == "__main__":
    if len(argv) > 1:
        hostname = argv[1]
        port = argv[2]
    else:
        hostname = "localhost"
        port = "3000"

    restserver = FabricRest(hostname, port)

    print "Using FABRIC_SAMPLES_DIR: " + os.getenv('FABRIC_SAMPLES_DIR','../../fabric-samples')

    unittest.main()
