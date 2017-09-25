# Hyperledger Fabric REST API, fabric-sdk-rest


## Overview
**This project is a work in progress** The Hyperledger Fabric REST API server is provided
by two node.js modules. The first defines a loopback connector for Hyperledger Fabric and
the second defines how to expose those capabilities over REST. The connector uses the
capabilities provided by fabric-sdk-node to interact with Hyperledger Fabric.

It is intended to provide the capabilities for [FAB-156][].

The design for this item can be found [on Google Docs][gd]. Comments on the design are
welcome.

Dev branch status:  
[![Build Status](https://jenkins.hyperledger.org/buildStatus/icon?job=fabric-sdk-rest-merge-x86_64)](https://jenkins.hyperledger.org/view/fabric-sdk-rest/job/fabric-sdk-rest-merge-x86_64/)


## Endpoint implementation status
This table provides a rough guide to what has been implemented.

| Verb   | REST Endpoint                                          | Implementation Status                                 | Test Available                     |
| :--:   | :--                                                    | :--                                                   | :--                                |
| `POST` | `/channels/{channelName}/transactions`                 | End to End done                                       | NO                                 |
| `POST` | ~~/channels/{channelName}/endorse~~                    | COMMENTED OUT, Needs clear use case to add back in    | NO                                 |
| `POST` | `/chaincodes`                                          | Done, needs more testing                              | YES but needs enhancing            |
| `POST` | `/channels/{channelName}/chaincodes`                   | Done                                                  | NO                                 |
| `PUT`  | ^^                                                     | Basic impl, test script run                           | NO                                 |
| `GET`  | ^^                                                     | Done                                                  | NO                                 |
| `GET`  | `/channels`                                            | Done                                                  | YES                                |
| `GET`  | `/channels/{channelName}`                              | Done, needs output validation                         | NO                                 |
| `POST` | ^^                                                     | Done                                                  | Creates mychannel of basic-network |
| `PUT`  | ^^                                                     | TODO                                                  | ???                                |
| `POST` | `/channels/{channelName}/peers`                        | Done                                                  | Join one peer to mychannel         |
| `GET`  | `/channels/{channelName}/transactions/{transactionID}` | Done, manual test, test script run                    | NO                                 |
| `GET`  | `/channels/{channelName}/blocks`                       | Done, manual test, test script run                    | NO                                 |
| `GET`  | `/channels/{channelName}/chaincodes/{id}`              | Done                                                  | YES                                |
| `GET`  | `/chaincodes/{id}`                                     | Done, manual test, test script run                    | NO                                 |
| `POST` | `/channels/{channelName}/ledger`                       | Done, manual test, test script run                    | PARTIAL                            |


## Dependencies
- `fabric-client` node module
- Node v6.9.x
- A Hyperledger Fabric v1.0 network to connect to
  - `https://github.com/hyperledger/fabric-samples.git` _Optional_
  - Clone this git repository to enable testing the REST server with the provided
    configuration


## Contributing
We welcome contributions to the Hyperledger Fabric SDK REST Project in
many forms.

Please read our [contributing guide](CONTRIBUTING.md) for details.


## Developer Installation
Install the prerequisites.

To use the source version of the fabric loopback connector run `npm link` in the
`loopback-connector-fabric` folder and run `npm link loopback-connector-fabric` in the
`fabric-rest` folder. The following commands should be run in the packages folder

```shell
npm install loopback-connector-fabric
npm install fabric-rest
```


## Configuration
For a simple configuration that works with `fabric-samples/fabcar` we have provided a
`setup.sh` script. See the [Sample configuration](#sample-configuration) section for more details.

**These configuration details will change once support for FAB-5363 is implemented**

For custom configuration, that still uses setup.sh, in the folder `packages/fabric-rest/server` change the contents of `datasources.json.template`
to reference the peer(s), orderer(s), and keystore, as well as to configure the
fabric user credentials.  Note that either string `AUSER` or `ADMINUSER` will be
replaced by the string `fabricUser` and that the string `FABSAMPLE` will be replaced
by what is passed on the -f option.

For custom configuration, that does not use setup.sh, in the folder `packages/fabric-rest/server` change the contents of `datasources.json`
to reference the peer(s), orderer(s), and keystore, as well as to configure the
`"fabricUser": {..}` credentials.  

To install and instantiate chaincode the server must be configured to run as a user with administrator access on the peer (setup.sh -a option), for standard work the server can be configured with any user that is known to the peer.


### Sample configuration
The settings in `datasources.json` (generated from the template) are used to configure
the known hyperledger fabric network and channels to the REST server by using the
capabilities provided by fabric-sdk-node. `datasources.json.template` along with
`setup.sh` have been created to provide a simple way to configure the REST API server to
work with `fabric-sample/fabcar` running in local Docker containers. It also contains
some unused fields that show the equivalent peers and orderers configured to work with
grpcs connections.

Note that the fabcar sample is a customization on top of basic-network so the `-f` option should point to `<your dir>/fabric-samples/basic-network` where `<your dir>` is the directory the fabric-samples have been downloaded to.

Running the basic-network from fabric-samples locally will start 4 containers.

| Node/Peer       | External IP:Port |
|:---             | :---             |
| Orderer         | 0.0.0.0:7050     |
| Org1, peer0     | 0.0.0.0:7051     |
| couchdb (peer0) | -                |
| CA (Org1)       | -                |


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
specified as arguments 1 and 2 respectively.

To test creating a new channel, joining a peer, and installing and instantiating
the fabcar chaincode the automated test `test_channel_setup.py` requires some set up.
- Set an environment variable for the location of the fabric-samples directory. `export FABRIC_SAMPLES_DIR=xxxx`
- Comment out the `docker exec` commands in the file `fabric-samples/basic-network/start.sh`
- Run that `start.sh` script to start the sample `basic-network` without a channel defined
Now the test can be run using the command `python test_channel_setup.py`. To rerun
this test, first `start.sh` must be run to redefine the basic-network without any artifacts.


## Fabric Examples: Input for Testing
Before running these tests ensure that the fabcar sample network is running, for example using `docker ps`. If it is not use the `startFabric.sh` script in the fabcar directory to start it.

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
then an error has occurred in the grpc communication layer. The status codes returned are available
in the grpc source code (Apache-2.0 licensed at time of writing) here https://github.com/grpc/grpc/blob/master/src/node/src/constants.js

For example a `"status": 14` means UNAVAILABLE and is caused by a problem with the REST server communicating with the peer or orderer. In this case check that the network is running (If the network is local `docker ps` will list the containers) and check that the addresses and ports used are also correct.

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

## Security

## Enabling SSL
By default, the server operates over HTTP. With the supplied option
`-s` or `--https`, however, HTTPS can be enabled. To do this, you must
first generate SSL keys. The server will look for these keys in the
directory `packages/fabric-rest/server/private`. The following files
are required:

- `certificate.pem`
- `certrequest.csr`
- `privatekey.pem`

To create these files, create and change to this directory, then issue
the following commands:

```bash
openssl genrsa -out privatekey.pem 1024
openssl req -new -key privatekey.pem -out certrequest.csr
openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
```

These commands will prompt for several questions. Generally, these
questions can be left with their default values, if you're setting
this up for testing purposes. Now, start the server with `node
. --https` or `node . -s`.

The `setup.sh` helper script has support for security too. Use the
`-t` option to use HTTPS when running the server, as well as running
the above commands to generate keys, if they don't already exist.


## License
<a rel="license"
href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative
Commons License" style="border-width:0"
src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br
/>This work is licensed under a <a rel="license"
href="http://creativecommons.org/licenses/by/4.0/">Creative Commons
Attribution 4.0 International License</a>.




[gd]: https://docs.google.com/document/d/1Kafw06IwtBbKFrUm8Hnwk8XYW7SyuqVbWad5VrPmvb8/edit?usp=sharing
[FAB-156]: https://jira.hyperledger.org/browse/FAB-156
[explorer]: http://0.0.0.0:3000/explorer/
[Passport]: http://passportjs.org/
