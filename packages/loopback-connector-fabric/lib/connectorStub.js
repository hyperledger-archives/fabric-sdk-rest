/*
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

//MUST inherit from loopback's Connector
var Connector = require('loopback-connector').Connector

const FabricConnector = require('./fabricconnector');

/**
* A loopback connector for the fabric-node-sdk for fabric v1
* - Pass information about the User credentials.
* TODO: Extend to allow callers to specify User to use.
*/

/**
 * Initialize the connector for the given data source
 *
 * @param {DataSource} ds The data source instance
 * @param {Function} [cb] The cb function
 */
exports.initialize = function(ds, cb) {
  //console.log(">> initialize");

  ds.connector = new FabricConnector(ds.settings);
  ds.connector.dataSource = ds;

  //console.log("<< initialize");
  cb();
};


  exports.connect = function(callback){
    //console.log(">> connect()");

    //TODO: Validate can connect to Fabric with the configured credentials
    //hfcsdk.Chain.connect(???)
    callback('OK'); //TODO

    //console.log("<< connect()");
  };

  exports.disconnect = function(callback){
    //console.log(">> disconnect()");

    // No op.
    callback(null);

    //console.log("<< disconnect()");
  };

  exports.ping = function(callback){
    //console.log(">> ping()");

    // No op.
    callback(null);

    //console.log("<< ping()");
  };
