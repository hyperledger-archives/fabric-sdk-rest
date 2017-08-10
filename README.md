# Hyperledger Fabric REST API, fabric-sdk-rest

## License

This project is licensed under [Apache License Version 2.0](LICENSE).

## Overview

**This project is a work in progress** The Hyperledger Fabric REST API server is provided
by two node.js modules. The first defines a loopback connector for Hyperledger Fabric and
the second defines how to expose those capabilities over REST. The connector uses the
capabilities provided by fabric-sdk-node to interact with Hyperledger Fabric.

It is intended to provide the capabilities for [FAB-156][].

The design for this item can be found [on Google Docs][gd]. Comments on the design are
welcome.

## Endpoint implementation status

This table provides a rough guide to what has been implemented.

| Verb | REST Endpoint | Implementation Status | Test Available |
| :--: | :--           | :--    | :-- |
| POST | /channels/{channelName}/transactions                 | End to End done but does not accept proposalResponses | NO |
| POST | /channels/{channelName}/endorse                      | Done, manual test, test script run | NO |
| POST | /chaincodes                                          | Done, needs more testing | YES but needs enhancing |
| POST | /channels/{channelName}/chaincodes                   | Done | NO |
| PUT  | ^^                                                   | Basic impl, test script run | NO |
| GET  | ^^                                                   | Done | NO |
| GET  | /channels                                            | Done | YES |
| GET  | /channels/{channelName}                              | Done, needs output validation | NO |
| POST | ^^                                                   | TODO | ??? |
| PUT  | ^^                                                   | TODO | ??? |
| POST | /channels/{channelName}/peers                        | TODO | ??? |
| GET  | /channels/{channelName}/transactions/{transactionID} | Done, manual test, test script run | NO |
| GET  | /channels/{channelName}/blocks                       | Done, manual test, test script run | NO |
| GET  | /channels/{channelName}/chaincodes/{id}              | Done | YES |
| GET  | /chaincodes/{id}                                     | Done, manual test, test script run | NO |
| POST | /channels/{channelName}/ledger                       | Done, manual test, test script run | PARTIAL |

## Dependencies

- `fabric-client` node module
- Node v6.9.x
- A Hyperledger Fabric v1.0 network to connect to
  - `https://github.com/hyperledger/fabric-samples.git` _Optional_
  - Clone this git repository to enable testing the REST server with the provided
    configuration

## Contributing

At this time only contributions will be accepted from authorized collaborators. If this project
is accepted into the Hyperledger Fabric project it will assume their contributions rules at that
time.

## Developer Installation

Install the prerequisites.

To use the source version of the fabric loopback connector run `npm link` in the
`loopback-connector-fabric` folder and run `npm link loopback-connector-fabric` in the
`fabric-rest` folder. The following commands should be run in the packages folder

```
npm install loopback-connector-fabric
npm install fabric-rest
```


## Configuration

For a simple configuration that works with the fabric-sample/fabcar we have provided a
`setup.sh` script.

For custom configuration, in the folder `packages/fabric-rest/server` change the contents
of `datasources.json.template` to reference the peer(s), orderer(s), and keystore, as
well as to configure the fabric user credentials.  To install and instantiate chaincode
the server must be configured to run as a user with administrator access on the peer, for
standard work the server can be configured with any user that is known to the peer.

### Sample configuration

The settings in `datasources.json` (generated from the template) are used to configure
the known hyperledger fabric network and channels to the REST server by using the
capabilities provided by fabric-sdk-node. `datasources.json.template` along with
`setup.sh` have been created to provide a simple way to configure the REST API server to
work with `fabric-sample/fabcar` running in local Docker containers. It also contains
some unused fields that show the equivalent peers and orderers configured to work with
grpcs connections.

One of the networks in fabric-samples consists of 4 peers owned by 2 different orgs that
have their own certificate authorities and can be started using docker images.

| Node/Peer    | External IP:Port |
|:---          | :---             |
| Orderer      | 0.0.0.0:7050     |
| Org1, peer0  | 0.0.0.0:7051     |
| Org1, peer1  | 0.0.0.0:8051     |
| Org2, peer0  | 0.0.0.0:9051     |
| Org2, peer1  | 0.0.0.0:10051    |


## Running the REST API

From within the `fabric-rest` project folder open a terminal and run `node .`. The
messages to the terminal will confirm when the LoopBack server is running. Try out the
API manually using the [LoopBack API Explorer interface][explorer], for your given
hostname and port.

`setup.sh` can be used to generate keys for a given started Fabric network, update
`datasources.json` from the supplied template, and start the REST API server. Full help
will be shown with `setup.sh -h`. The following command will start the REST API server as
Admin in debug mode after updating `datasources.json`, and generating keys. Note that the
Fabric network directory must be specified.

```
setup.sh -f ~/fabric-samples/basic-network/ -dukas
```

HTTP Basic authentication is provided using [Passport][] as standard, with a default
username and password combination of `chris:secret`. This should be passed on all URL
invocations.


## Testing the REST API

The `tests` directory contains a python wrapper for the REST API, and modules to run
tests against the REST API server for specific Fabric sample networks. For example, after
starting the `fabcar` sample network, run

```
python test_fabcar.py
```

The default hostname and port values for the REST API, `localhost` and `3000`, can be
specified as arguments 1 and 2 respectively. Correct output will be, for example,

```
First channel name test: passed
Car color test: passed
```


## Fabric Examples: Input for Testing


### Fabcar

Browse to the [Loopback Explorer][explorer] interface.


#### Query ledger using chaincode for all cars

Issue a `POST` request to `/fabric/1_0/channels/{channelName}/ledger` with the following
values by default:

`channel`
: `mychannel`

`chaincodeId`
: `fabcar`

Request body
: `{"fcn": "queryAllCars","args": []}`


#### Query ledger using chaincode for one car

Issue a `POST` request to `/fabric/1_0/channels/{channelName}/ledger` with the following
values by default:

`channel`
: `mychannel`

`chaincodeId`
: `fabcar`

Request body
: `{"fcn": "queryCar","args": ["CAR4"]}`


### Propose a transaction

`channel`
: `mychannel`

Request body
: `{"proposal":{"chaincodeId": "fabcar", "fcn": "createCar", "args": ["CAR10", "Chevy",
  "Volt", "Red", "Nick"]}}`

__Passing the response from this on to the transaction end point will not work at this
time, it requires session management or new SDK functionality to be implemented__


### End to End transaction

`channel`
: `mychannel`

Request body
: `{"proposalResponses":[],"proposal":{"chaincodeId": "fabcar", "fcn": "createCar", "args": ["CAR10", "Chevy", "Volt", "Red", "Nick"]}}`


## Logging

The logging used relies on the logger being set for fabric-sdk-node. The following
assumes that the default Winston logger is used and the command to start the REST server
is run from within the `fabric-rest` directory.

To run with debug, error and info logging to the console start the fabric-client with
`node . --hfc-logging '{"debug":"console"}'` This sends all log messages for debug and
more important to that location.

The following configuration is bad as it will result in 3 error messages for each error
and 2 info messages for each info being sent to the console.  `node . --hfc-logging
'{"info":"console","error":"console","debug":"console"}'`

The following will send error, info and debug messages to a file, and just error messages
to the console. `node . --hfc-logging
'{"error":"console","debug":"/tmp/fabricRestDebug.log"}'`





[gd]: https://docs.google.com/document/d/1Kafw06IwtBbKFrUm8Hnwk8XYW7SyuqVbWad5VrPmvb8/edit?usp=sharing
[FAB-156]: https://jira.hyperledger.org/browse/FAB-156
[explorer]: http://0.0.0.0:3000/explorer/
[Passport]: http://passportjs.org/
