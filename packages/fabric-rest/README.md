# fabric-rest

## Description
This is a loopback application that provides a REST API on top of fabric-sdk-node using a loopback connector for hyperledger fabric.

## License
See http://www.apache.org/licenses/LICENSE-2.0

## Configuration
Update `datasources.json` to change the properties of fabricDataSource to reference the hyperledger fabric peers and orderers that the connector will use.  

## Development set up
This requires the `loopback-connector-fabric` to be available.  
To use the source version use `npm link` in the `loopback-connector-fabric` folder and `npm link loopback-connector-fabric` in this project's root folder.

The `node_modules` folder has not been pushed to git. Run `npm update` from within the folder.
