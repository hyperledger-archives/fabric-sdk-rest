# Hyperledger Fabric SDK REST Server


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
- Node v6.9.x
- A Hyperledger Fabric v1.0 network to connect to
  - Optionally use `https://github.com/hyperledger/fabric-samples.git`
- Hyperledger Fabric Docker images
  - Follow the instructions in the "Download Platform-specific Binaries" section of the [Fabric samples documentation](http://hyperledger-fabric.readthedocs.io/en/latest/samples.html)


## Developer Installation
1. Install the dependencies detailed above.
2. Run `npm link` in the `packages/loopback-connector-fabric` directory.
3. Run `npm link loopback-connector-fabric` in the `packages/fabric-rest` directory.
4. Run `npm install` in the `packages/fabric-rest` directory.
5. To allow the LDAP testing server to start, run `npm install` in the project root directory.


## Configuration
For a simple configuration that works with the _Fabcar_ sample network, we have provided a
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


### Sample Configuration
The settings in `datasources.json` (generated from the template) are used to configure
the known Hyperledger Fabric network and channels to the REST server by using the
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


## Running the REST API Server
A setup script, `setup.sh`, is provided to configure the REST API
Server. It can:

- Generate self-signed TLS keys for secure connections
- Find user (including admin) keys for a given started Fabric network
- Populate `datasources.json` from `datasources.json.template`

Full help will be shown with `setup.sh -h`. The following command will
configure the REST API server to use the Admin user by updating
`datasources.json`, and generating keys. Note that the Fabric network
directory must be specified:

```bash
setup.sh -f ~/fabric-samples/basic-network/ -ukat
```

Once setup (either with the above script or manually defining the file
`datasources.json`), the REST server can be started. To do this,
invoke the script `./fabric-rest-server` from the `fabric-rest`
package directory (in that location or symlinked elsewhere). The
messages to the terminal will confirm when the LoopBack server is
running.

`fabric-rest-server` allows for a port to be specified for the server
to listen on with the `-p` option. Try out the API manually using the
[LoopBack API Explorer interface][explorer], for your given hostname
and port.


## Starting the server
In the `fabric-rest` package directory run the command
`./fabric-rest-server`.

By default the server will read the Fabric connection profile
information (which peers to connect to, etc.) from
`datasources.json`. An absolute file name to read can be specified
with the `-s` option. To see all command line options run
`./fabric-rest-server -h`.


## Security and Authentication Mechanisms
See our documentation on [securing the REST server and configuring
authentication mechanisms](docs/SECURITY.md).


## Testing the REST Server
See our documentation on [testing the REST server](docs/TESTING.md).


## Logging
The logging used relies on the logger being set for fabric-sdk-node. The following
assumes that the default Winston logger is used and the command to start the REST server
is run from within the `fabric-rest` directory.

To run with logging enabled for debugging purposes, start the REST
server with `fabric-rest-server -d`. This is equivalent to
 
 ```bash
fabric-rest-server -l '{"debug":"console"}'
```

This sends all log messages of debug or greater importance to that
location (in this case, the console). The `-l` option allows for an
arbitrary logging configuration to be defined.

The following configuration is bad as it will result in 3 error
messages for each error and 2 info messages for each info being sent
to the console:

```bash
fabric-rest-server -l '{"info":"console","error":"console","debug":"console"}'
```

The following will send error, info and debug messages to a file, and
just error messages to the console.

```bash
fabric-rest-server -l '{"error":"console","debug":"/tmp/fabricRestDebug.log"}'
```


## Contributing
We welcome contributions to the Hyperledger Fabric SDK REST Project in
many forms.

Please read our [contributing guide](docs/CONTRIBUTING.md) for details.


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
[ldapjs]: http://ldapjs.org/
