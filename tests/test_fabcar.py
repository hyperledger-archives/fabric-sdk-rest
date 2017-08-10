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
import unittest


class TestFabCar(unittest.TestCase):

    def test_first_channel_name(self):
        """Test to confirm that the first channel on the network has the default name of
        mychannel.
        """
        first_channel = restserver.get_channels()["channels"][0]["channel_id"]
        self.assertEqual(first_channel, "mychannel")


    def test_car_color(self):
        """Test to confirm that the first car returned from a ledger query is the color blue."""
        car_color = restserver.query_ledger("mychannel", chaincode_id="fabcar",
                                            data=r'{"fcn":"queryAllCars","args":[]}')["queryResult"][0]["Record"]["colour"]
        self.assertEqual(car_color, "blue")


    def test_peer_chaincode_query(self):
        """Test to confirm that querying a peer for fabcar chaincode returns a result and querying for fab does not."""
        chaincode_name = restserver.query_chaincode("fabcar","%5B0%5D")["queryResult"][0]["name"]
        self.assertEqual(chaincode_name, "fabcar")

        empty_result = restserver.query_chaincode("fab","%5B0%5D")["queryResult"][0]
        self.assertEqual(empty_result, {})


    def test_chaincode_install(self):
        """Test to confirm that installing chaincode on a peer works."""
        # install chaincode: id, path(in archive), archive as base64 string, version, peers
        archiveFile = open('input/installTest.tar.gz', 'rb')
        archiveInb64 = base64.b64encode(archiveFile.read())
        #install_result = restserver.install_chaincode("marbles","marbles02/marbles_chaincode.go",archiveInb64,"1.1","%5B0%5D")["peerResponses"]
        install_result = restserver.install_chaincode("marbles","marbles02",archiveInb64,"1.0","%5B0%5D")["peerResponses"]
        #install_result = restserver.install_chaincode_file("marbles","marbles02/marbles_chaincode.go","1.0","%5B0%5D")["peerResponses"]
        # print install_result


if __name__ == "__main__":
    if len(argv) > 1:
        hostname = argv[1]
        port = argv[2]
    else:
        hostname = "localhost"
        port = "3000"

    restserver = FabricRest(hostname, port)

    unittest.main()
