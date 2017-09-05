#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Test Fabcar Sample
#
# Basic tests to confirm that REST calls into the Fabcar sample network work.


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

    def test_query_blockid(self):
        """Test to confirm that a block is returned by the query."""
        block_header = restserver.query_ledger("mychannel", block_id="1")["header"]
        #Test will fail if header not part of response.

    def test_query_blockid_404(self):
        """Test to confirm that a block is returned by the query."""
        status_code = restserver.query_ledger("mychannel", block_id="99999")["error"]["statusCode"]
        self.assertEqual(status_code, 404)


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


if __name__ == "__main__":
    if len(argv) > 1:
        hostname = argv[1]
        port = argv[2]
    else:
        hostname = "localhost"
        port = "3000"

    restserver = FabricRest(hostname, port)

    unittest.main()
