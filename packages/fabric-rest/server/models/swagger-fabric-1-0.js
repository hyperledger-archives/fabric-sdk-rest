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

module.exports = function(SwaggerApi) {

/**
 * Commit a transaction, if no proposal responses propose and commit.
 * @param {string} channelName Name of the channel
 * @param {transaction} transaction The transaction to commit and any proposal response.
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {any} result Result object
 */
SwaggerApi.postChannelsChannelNameTransactions = function(channelName, transaction, callback) {

  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.postChannelsChannelNameTransactions(channelName, transaction, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Send a proposal to the channel's peers. This could be for either chaincode or a transaction.
 * @param {string} channelName Name of the channel
 * @param {integer[]} peers Peers to send proposal to
 * @param {TODO} transaction The proposal.
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {proposalResult} result Result object
 */
SwaggerApi.postChannelsChannelNameEndorse = function(channelName, peers, transaction, callback) {
  var datasource = SwaggerApi.app.datasources.fabricDataSource;
  var connector = datasource.connector;
  connector.postChannelsChannelNameEndorse(channelName, peers, transaction, connector).then(
    function(response){
      callback(null,response);
    },
    function(err){
      callback(err);
    }
  );

}

/**
 * Install chaincode onto the named peers
 * @param {integer[]} peers Optional Peers array to install chaincode on
 * @param {ChaincodeInstallRequest} chaincode The chaincode install data.
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {any} result Result object
 */
SwaggerApi.postChaincodes = function(peers, chaincode, callback) {
  var datasource = SwaggerApi.app.datasources.fabricDataSource;
  var connector = datasource.connector;
  connector.postChaincodes(peers, chaincode, connector).then(
    function(response){
      callback(null,response);
    },
    function(err){
      callback(err);
    }
  );

}

/**
 * Instantiate new chaincode in the channel for the named peers
 * @param {string} channelName Name of the channel
 * @param {integer[]} peers Peers to instantiate chaincode on
 * @param {chaincodeInstantiate} chaincode The chaincode instantiate data.
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {proposalResult} result Result object
 */
SwaggerApi.postChannelsChannelNameChaincodes = function(channelName, peers, chaincode, callback) {

  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.postChannelsChannelNameChaincodes(channelName, peers, chaincode, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Instantiate updated chaincode in the channel for the named peers
 * @param {string} channelName Name of the channel
 * @param {integer[]} peers Peers to instantiate chaincode on
 * @param {chaincodeInstantiate} chaincode The chaincode instantiate data.
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {proposalResult} result Result object
 */
SwaggerApi.putChannelsChannelNameChaincodes = function(channelName, peers, chaincode, callback) {

  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.putChannelsChannelNameChaincodes(channelName, peers, chaincode, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Query all chaincode instantiated on the channel
 * @param {string} channelName Name of the channel
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {TODO} result Result object
 */
SwaggerApi.getChannelsChannelNameChaincodes = function(channelName, callback) {

  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.getChannelsChannelNameChaincodes(channelName, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Get all known channels from the primary peer

 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {ChannelQueryResponse} result Result object
 */
SwaggerApi.getChannels = function(callback) {
  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;

    connector.getChannels(connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Get information about the named channel
 * @param {string} channelName Name of the channel
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {channelInfo} result Result object
 */
SwaggerApi.getChannelsChannelName = function(channelName, callback) {
  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.getChannelsChannelName(channelName, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Create the named channel
 * @param {string} channelName Name of the channel to create
 * @param {channel} channel The channel with values to use
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {any} result Result object
 */
SwaggerApi.postChannelsChannelName = function(channelName, channel, callback) {
  // Replace the code below with your implementation.
  // Please make sure the callback is invoked.
  process.nextTick(function() {
    var err = new Error('Not implemented');
    callback(err);
  });

}

/**
 * Update the named channel
 * @param {string} channelName Name of the channel to update
 * @param {channel} channel The channel with values to update
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {any} result Result object
 */
SwaggerApi.putChannelsChannelName = function(channelName, channel, callback) {
  // Replace the code below with your implementation.
  // Please make sure the callback is invoked.
  process.nextTick(function() {
    var err = new Error('Not implemented');
    callback(err);
  });

}

/**
 * Join a Peer to the channel
 * @param {string} channelName Name of the channel to join the peer to
 * @param {peer} peer The peer information
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {any} result Result object
 */
SwaggerApi.postChannelsChannelNamePeers = function(channelName, peer, callback) {
  // Replace the code below with your implementation.
  // Please make sure the callback is invoked.
  process.nextTick(function() {
    var err = new Error('Not implemented');
    callback(err);
  });

}

/**
 * Query a transaction on a channel by ID
 * @param {string} channelName Name of the channel
 * @param {string} transactionID The transaction ID to query
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {TODO} result Result object
 */
SwaggerApi.getChannelsChannelNameTransactionsTransactionID = function(channelName, transactionID, callback) {
  var datasource = SwaggerApi.app.datasources.fabricDataSource;
  var connector = datasource.connector;
  connector.getChannelsChannelNameTransactionsTransactionID(channelName, transactionID, connector).then(
    function(response){
      callback(null,response);
    },
    function(err){
      callback(err);
    }
  );

}

/**
 * Query a block on a channel by ID or Hash
 * @param {string} channelName Name of the channel
 * @param {string} blockId Query data
 * @param {string} blockHash Query data
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {block} result Result object
 */
SwaggerApi.getChannelsChannelNameBlocks = function(channelName, blockId, blockHash, callback) {
  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.getChannelsChannelNameBlocks(channelName, blockId, blockHash, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Query chaincode instantiated on a channel by ID
 * @param {string} channelName Name of the channel
 * @param {string} id Chaincode ID
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {TODO} result Result object
 */
SwaggerApi.getChannelsChannelNameChaincodesId = function(channelName, id, callback) {
  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.getChannelsChannelNameChaincodesId(channelName, id, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Query chaincode installed on a peer by ID
 * @param {string} id Chaincode ID
 * @param {integer[]} peers Peers to query for installed chaincode
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {TODO} result Result object
 */
SwaggerApi.getChaincodesId = function(id, peers, callback) {

  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;
    connector.getChaincodesId(id, peers, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}

/**
 * Query the channel's ledger
 * @param {string} channelName Name of the channel
 * @param {string} chaincodeId Chaincode ID to look for
 * @param {integer} blockId Block ID to look for
 * @param {string} blockHash Block Hash to look for
 * @param {string} txnId Transaction ID to look for
 * @param {args} args Optional args for query by chaincode
 * @callback {Function} callback Callback function
 * @param {Error|string} err Error object
 * @param {TODO} result Result object
 */
SwaggerApi.postChannelsChannelNameLedger = function(channelName, chaincodeId, blockId, blockHash, txnId, args, callback)  {
  process.nextTick(function() {
    var datasource = SwaggerApi.app.datasources.fabricDataSource;
    var connector = datasource.connector;

    // console.log(channelName);
    // console.log(chaincodeId);
    // console.log(blockId);
    // console.log(blockHash);
    // console.log(txnId);
    // console.log(args);

    connector.postChannelsChannelNameLedger(channelName, chaincodeId, blockId, blockHash, txnId, args, connector).then(
      function(response){
        callback(null,response);
      },
      function(err){
        callback(err);
      }
    );
  });

}



SwaggerApi.remoteMethod('postChannelsChannelNameTransactions',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'transaction',
       type: 'transaction',
       description: 'The transaction to commit and any proposal response.',
       required: true,
       http: { source: 'body' } } ],
  returns: [{ description: 'Successful response',
      type: 'TODO',
      arg: 'data',
      root: true }],
  http: { verb: 'post', path: '/channels/:channelName/transactions', status: 202 },
  description: 'Commit a transaction, if no proposal responses propose and commit.' }
);

SwaggerApi.remoteMethod('postChannelsChannelNameEndorse',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'peers',
       type: [ 'integer' ],
       description: 'Peers to send proposal to',
       required: false,
       http: { source: 'query' } },
     { arg: 'transaction',
       type: 'TODO',
       description: 'The proposal.',
       required: true,
       http: { source: 'body' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'proposalResult',
       arg: 'data',
       root: true } ],
  http: { verb: 'post', path: '/channels/:channelName/endorse', status: 202 },
  description: 'Send a proposal to the channel\'s peers. This could be for either chaincode or a transaction.' }
);

SwaggerApi.remoteMethod('postChaincodes',
  { isStatic: true,
  accepts:
   [ { arg: 'peers',
       type: [ 'integer' ],
       description: 'Peers to install chaincode on',
       required: true,
       http: { source: 'query' } },
     { arg: 'chaincode',
       type: 'ChaincodeInstallRequest',
       description: 'The chaincode install data.',
       required: true,
       http: { source: 'body' } } ],
  returns: [ { description: 'Successful response',
      type: 'proposalResult',
      arg: 'data',
      root: true } ],
  http: { verb: 'post', path: '/chaincodes' },
  description: 'Install chaincode onto the named peers' }
);

SwaggerApi.remoteMethod('postChannelsChannelNameChaincodes',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'peers',
       type: [ 'integer' ],
       description: 'Peers to instantiate chaincode on',
       required: true,
       http: { source: 'query' } },
     { arg: 'chaincode',
       type: 'chaincodeInstantiate',
       description: 'The chaincode instantiate data.',
       required: true,
       http: { source: 'body' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'proposalResult',
       arg: 'data',
       root: true } ],
  http: { verb: 'post', path: '/channels/:channelName/chaincodes' },
  description: 'Instantiate new chaincode in the channel for the named peers' }
);

SwaggerApi.remoteMethod('putChannelsChannelNameChaincodes',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'peers',
       type: [ 'integer' ],
       description: 'Peers to instantiate chaincode on',
       required: true,
       http: { source: 'query' } },
     { arg: 'chaincode',
       type: 'chaincodeInstantiate',
       description: 'The chaincode instantiate data.',
       required: true,
       http: { source: 'body' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'proposalResult',
       arg: 'data',
       root: true } ],
  http: { verb: 'put', path: '/channels/:channelName/chaincodes' },
  description: 'Instantiate updated chaincode in the channel for the named peers' }
);

SwaggerApi.remoteMethod('getChannelsChannelNameChaincodes',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'TODO',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/channels/:channelName/chaincodes' },
  description: 'Query all chaincode instantiated on the channel' }
);

SwaggerApi.remoteMethod('getChannels',
  { isStatic: true,
  accepts: [],
  returns:
   [ { description: 'Successful response',
       type: 'ChannelQueryResponse',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/channels' },
  description: 'Get the names of known channels from the primary peer' }
);

SwaggerApi.remoteMethod('getChannelsChannelName',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'channelInfo',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/channels/:channelName' },
  description: 'Get information about the named channel' }
);

SwaggerApi.remoteMethod('postChannelsChannelName',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel to create',
       required: true,
       http: { source: 'path' } },
     { arg: 'channel',
       type: 'channel',
       description: 'The channel with values to use',
       required: true,
       http: { source: 'body' } } ],
  returns: [],
  http: { verb: 'post', path: '/channels/:channelName' },
  description: 'Create the named channel' }
);

SwaggerApi.remoteMethod('putChannelsChannelName',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel to update',
       required: true,
       http: { source: 'path' } },
     { arg: 'channel',
       type: 'channel',
       description: 'The channel with values to update',
       required: true,
       http: { source: 'body' } } ],
  returns: [],
  http: { verb: 'put', path: '/channels/:channelName' },
  description: 'Update the named channel' }
);

SwaggerApi.remoteMethod('postChannelsChannelNamePeers',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel to join the peer to',
       required: true,
       http: { source: 'path' } },
     { arg: 'peer',
       type: 'peer',
       description: 'The peer information',
       required: true,
       http: { source: 'body' } } ],
  returns: [],
  http: { verb: 'post', path: '/channels/:channelName/peers' },
  description: 'Join a Peer to the channel' }
);

SwaggerApi.remoteMethod('getChannelsChannelNameTransactionsTransactionID',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'transactionID',
       type: 'string',
       description: 'The transaction ID to query',
       required: true,
       http: { source: 'path' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'ProcessedTransaction',
       arg: 'data',
       root: true } ],
  http:
   { verb: 'get',
     path: '/channels/:channelName/transactions/:transactionID' },
  description: 'Query a transaction on a channel by ID' }
);

SwaggerApi.remoteMethod('getChannelsChannelNameBlocks',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'blockId',
       type: 'integer',
       description: 'Query data',
       required: false,
       http: { source: 'query' } },
     { arg: 'blockHash',
       type: 'string',
       description: 'Query data',
       required: false,
       http: { source: 'query' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'block',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/channels/:channelName/blocks' },
  description: 'Query a block on a channel by ID or Hash' }
);

SwaggerApi.remoteMethod('getChannelsChannelNameChaincodesId',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'id',
       type: 'string',
       description: 'Chaincode ID',
       required: true,
       http: { source: 'path' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'TODO',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/channels/:channelName/chaincodes/:id' },
  description: 'Query chaincode instantiated on a channel by ID' }
);

SwaggerApi.remoteMethod('getChaincodesId',
  { isStatic: true,
  accepts:
   [ { arg: 'id',
       type: 'string',
       description: 'Chaincode ID',
       required: true,
       http: { source: 'path' } },
     { arg: 'peers',
       type: [ 'integer' ],
       description: 'Peers to query for installed chaincode',
       required: true,
       http: { source: 'query' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'TODO',
       arg: 'data',
       root: true } ],
  http: { verb: 'get', path: '/chaincodes/:id' },
  description: 'Query chaincode installed on a peer by ID' }
);

SwaggerApi.remoteMethod('postChannelsChannelNameLedger',
  { isStatic: true,
  accepts:
   [ { arg: 'channelName',
       type: 'string',
       description: 'Name of the channel',
       required: true,
       http: { source: 'path' } },
     { arg: 'chaincodeId',
       type: 'string',
       description: 'Chaincode ID to look for',
       required: false,
       http: { source: 'query' } },
     { arg: 'blockId',
       type: 'integer',
       description: 'Block ID to look for',
       required: false,
       http: { source: 'query' } },
     { arg: 'blockHash',
       type: 'string',
       description: 'Block Hash to look for',
       required: false,
       http: { source: 'query' } },
     { arg: 'txnId',
       type: 'string',
       description: 'Transaction ID to look for',
       required: false,
       http: { source: 'query' } },
     { arg: 'args',
       type: 'args',
       description: 'Optional args for query by chaincode',
       required: false,
       http: { source: 'body' } } ],
  returns:
   [ { description: 'Successful response',
       type: 'TODO',
       arg: 'data',
       root: true } ],
  http: { verb: 'post', path: '/channels/:channelName/ledger' },
  description: 'Query the channel\'s ledger' }
);

}
