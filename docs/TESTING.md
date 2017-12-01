# Testing the REST API
The `tests` directory contains a python wrapper for the REST API, and
modules to run tests against the REST API server for specific Fabric
sample networks.

These tests authenticate using LDAP, configured with the defaults for
the LDAP server provided in the `authentication` directory.

The tests make use of the _Fabcar_ sample network. You can run tests
individually against an already-started Fabcar network, or make use of
a supplied sample network.


## Run All Tests Against a Supplied Sample Network
A version of the _Fabcar_ sample network is packaged with this project
to ease testing. To run all the tests in turn, run the `fullRun.sh`
test script. This will:

1. Configure OpenSSL keys for TLS, if not already present in the
   server's `private` directory
2. Start up a supplied Hyperledger Fabric network
3. Start the supplied LDAP server
4. Start the SDK REST server
5. Run all tests in order, connecting over HTTP
6. Run tests with TLS enabled

From the `fabric-sdk-rest` directory, run

```bash
npm test
```

A successful test will show output such as:

```bash
Test suite 1:  PASSED
Test suite 2:  PASSED
Test suite 3:  PASSED
Test suite 4:  PASSED
```

The port for the REST server to listen on, and the tests to connect
to, can be specified with the `-p` parameter. In addition,
`fullRun.sh` supports the following options:

- `-f`: Force removal of 'hyperledger' Docker containers
- `-k`: Don't kill the LDAP server or Fabric REST server

The `-f` option can be used if you suspect other Hyperledger-related
Docker containers and causing issues with the sample network.

If you wish to run through all the tests to confirm a healthy system,
but wish to keep using the started LDAP and SDK REST servers, the `-k`
option will tell you their process IDs, but not issue the `kill`
commands.

Full help can be shown with `fullRun.sh -h`.

## Run Individual Tests
If you start a network another way, for example by starting the
_fabcar_ sample network yourself, run the tests individually, e.g.,

```bash
python test_fabcar.py
```

This python test takes a `--help` parameter; specify `--hostname` or
`--port` if the defaults of `localhost` and `3000` do not
suffice. Option `--tls` enables TLS requests to the REST server, if
the REST server has been configured to accept requests over HTTPS
only.


## Test Channel Creation
To test creating a new channel, joining a peer, and installing and
instantiating the fabcar chaincode, the automated test
`test_channel_setup.py` requires some set up:

- Set an environment variable for the location of the fabric-samples
directory:

  ```bash
  export FABRIC_SAMPLES_DIR=xxxx
  ```

- Comment out the `docker exec` commands in the file
  `fabric-samples/basic-network/start.sh`
- Run that `start.sh` script to start the sample `basic-network`
  without a channel defined

Now the test can be run using the command

```bash
python test_channel_setup.py
```

To rerun this test, first `start.sh` must be run to redefine the
basic-network without any artifacts.


## Example Input for Testing
Before running these tests ensure that the fabcar sample network is
running, for example using `docker ps`. If it is not use the
`startFabric.sh` script in the fabcar directory to start it.


### Fabcar
Browse to the [Loopback Explorer][explorer] interface.


#### Query ledger using chaincode for all cars
Issue a `POST` request to `/fabric/1_0/channels/{channelName}/ledger` with the following
values by default:

`channel`
: `mychannel`

`chaincodeId`
: `fabcar`

Request body:
```json
 {
   "fcn": "queryAllCars",
   "args": []
 }
 ```


#### Query ledger using chaincode for one car
Issue a `POST` request to `/fabric/1_0/channels/{channelName}/ledger` with the following
values by default:

`channel`
: `mychannel`

`chaincodeId`
: `fabcar`

Request body:
```json
{
  "fcn": "queryCar",
  "args": ["CAR4"]
}
```

Expected Response (truncated), code `200`:
```json
{
  "queryResult": [
    {
      "Key": "CAR0",
      "Record": {
        "colour": "blue",
        "make": "Toyota",
        "model": "Prius",
        "owner": "Tomoko"
      }
    },
    {
      "Key": "CAR1",
      "Record": {

      }
    }
  ]
}
```

<!-- ### Propose a transaction
`channel`
: `mychannel`

Request body
: `{"proposal":{"chaincodeId": "fabcar", "fcn": "createCar", "args": ["CAR10", "Chevy",
  "Volt", "Red", "Nick"]}}`

__Passing the response from this on to the transaction end point will not work at this
time, it requires session management or new SDK functionality to be implemented__ -->


#### End to End transaction
`channel`
: `mychannel`

Request body:
```json
{
    "proposalResponses":[],
    "proposal": {
      "chaincodeId": "fabcar",
      "fcn":"createCar",
      "args": ["CAR10", "Chevy", "Volt", "Red", "Nick"]
    }
}
```


#### Unexpected responses
There could be several different causes for an unexpected response body.

If a response is returned that contains a body similar to this:

```json
{
  "status": 14,
  "metadata":{   }
}
```

then an error has occurred in the grpc communication layer. The status
codes returned are available in the [grpc source code][grpc]
(Apache-2.0 licensed at time of writing).


For example a `"status": 14` means UNAVAILABLE and is caused by a
problem with the REST server communicating with the peer or
orderer. In this case check that the network is running (if the
network is local `docker ps` will list the containers) and check that
the addresses and ports used are also correct.




[explorer]: http://0.0.0.0:3000/explorer/
[grpc]: https://github.com/grpc/grpc-node/blob/master/packages/grpc-native-core/src/constants.js
