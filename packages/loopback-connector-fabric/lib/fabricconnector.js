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
//Classes from Fabric SDK
const Client = require('fabric-client/lib/Client');
const Channel = require('fabric-client/lib/Channel');
const Peer = require('fabric-client/lib/Peer');
var Common = require('./Common.js');

//This module requires fabric-client so safe to use the same logger as set for sdk.
const sdkutils = require('fabric-client/lib/utils');
var logger = sdkutils.getLogger('fabricconnector.js');


//A class that extends Connector to allow functions to be called from a Model.
class HFCSDKConnector extends Connector {

  constructor(settings){
    super();
    //console.log(">> HFCSDKConnector");
    Connector.call(this, 'hfc-sdk', settings);

    this.settings = settings; // Store the settings for ease of access

    Common.validateSettings(this.settings);

    //logger.info("Info output test");
    //logger.debug("Debugging output test");
    //logger.error("Error output test");
  };


  /**
   * Install chaincode onto the named peers
   * @param {integer[]} peers Peers array to install chaincode on
   * @param {ChaincodeInstallRequest} chaincode The chaincode install data. https://fabric-sdk-node.github.io/global.html#ChaincodeInstallRequest
   * @param {object} lbConnector The loopback connector object
   *
   * @returns {any} result Result object
   */
  postChaincodes(peers, chaincode, lbConnector){
    if(chaincode.chaincodePackage === undefined){
      logger.debug("postChaincodes() - no chaincodePackage in request");
      var err = new Error("Bad Request");
      err.statusCode = 400; //Bad request
      return Promise.reject(err);
    }

    var clientPromise = Common.getClient(lbConnector.settings);
    var peerArrayPromise;
    if(peers !== undefined){
      peerArrayPromise = Common.getPeers(lbConnector.settings, peers);
    }
    else { //Get all known peers
      peerArrayPromise = Common.getPeers(lbConnector.settings);
    }

    //Once we have both Client and Peers use the client to install chaincode on the Peers
    return Promise.all([clientPromise,peerArrayPromise]).then(
      (data)=>{
        var theClient = data[0];
        var peerArray = data[1];
        // Convert base64 archive input to a Buffer
        var packageBuffer = Buffer.from(chaincode.chaincodePackage, 'base64');
        var request = chaincode;
        request.targets = peerArray;
        request.txId = theClient.newTransactionID();
        request.chaincodePackage = packageBuffer;

        logger.debug("postChaincodes() - About to call installChaincode, "+request.chaincodeId+", "+request.chaincodeVersion);

        //Expects https://fabric-sdk-node.github.io/global.html#ChaincodeInstallRequest with a targets parameter too.
        return theClient.installChaincode(request);
    }).then((results) => {
  		var proposalResponses = results[0];
      //Do some internal checking to help debug.
      var failed = Common.countFailedProposalResponses(proposalResponses);
      var resp = {};
      resp.peerResponses = results;
      //Always send results from Peers even if not all worked.
      return Promise.resolve(resp);
    }).catch((err)=>{
      logger.debug("postChaincodes() - Error caught");
      if(err instanceof Error && !err.statusCode) err.statusCode = 501;
      return Promise.reject(err);
    });
  }

  /**
   * Query chaincode installed on a peer by ID
   * @param {string} id Chaincode ID
   * @param {integer[]} peers Peers to query for installed chaincode
   * @param {object} lbConnector The loopback connector object
   *
   */
  getChaincodesId(id, peers, lbConnector){
    //1. Get client and known peers
    var clientPromise = Common.getClient(lbConnector.settings);
    var peerArrayPromise;
    if(peers !== undefined){
      peerArrayPromise = Common.getPeers(lbConnector.settings, peers);
    }
    else { //Get all known peers
      peerArrayPromise = Common.getPeers(lbConnector.settings);
    }

    //2. Once we have both Client and Peers use the client to query chaincode on the Peers
    return Promise.all([clientPromise,peerArrayPromise]).then( (data)=>{
      var aClient = data[0];
      var promises = [];
      data[1].forEach( function(aPeer,index){
        promises[index] = aClient.queryInstalledChaincodes(aPeer);
      });
      return Promise.all(promises);
    }).then((data)=>{
      var response = {"queryResult":[]};
      //3. Got responses from all peers, check for the named chaincode in result set
      data.forEach(function( chaincodeQueryResult,index){
        response.queryResult[index] = {}; //Init result for peer to empty object
        // If result from peer with chaincode, look at content
        if(chaincodeQueryResult !== undefined
          && chaincodeQueryResult.chaincodes !== undefined
        ){
          for (var i = 0, len = chaincodeQueryResult.chaincodes.length; i < len; i++) {
            if(chaincodeQueryResult.chaincodes[i].name !== undefined
               && chaincodeQueryResult.chaincodes[i].name == id
            ){
              // If match found add it to index of peer in response
              response.queryResult[index] = chaincodeQueryResult.chaincodes[i]
            }
          }
        }
      });
      return Promise.resolve(response);
    }).catch((err)=>{
      logger.debug("getChaincodesId() - Error caught");
      if(err instanceof Error && !err.statusCode) err.statusCode = 501;
      return Promise.reject(err);
    });
  }


  /**
   * Instantiate new chaincode proposal
   * @param {string} channelName Name of the channel
   * @param {integer[]} peers optional index(es) into datasources.json peers array to request endorsement from.
   * @param {chaincodeInstantiate} chaincode The data needed to instantiate chaincode on the channel, see https://fabric-sdk-node.github.io/global.html£ChaincodeInstantiateUpgradeRequest
   * @param {object} lbConnector The loopback connector object
   *
   * @returns {Promise} Resolving to the result
   */
  postChannelsChannelNameChaincodes(channelName, peers, chaincode, lbConnector){
    var request = {};
    var theClient;
    var theChannel;

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("postChannelsChannelNameChaincodes() - created client instance");
      theClient = aClient;
      //2. Get the Channel to instantiate chaincode on
      theChannel = theClient.getChannel(channelName);

      //3. Channel must be initialized to instantiate chaincode.
      return theChannel.initialize();
    }).then( (ignored)=>{
      //4. build txId
      request = chaincode;
      request.txId = theClient.newTransactionID();

      //5. Propose it
      return theChannel.sendInstantiateProposal(request);

    }).then( (instantiateResponse)=>{
      //6 Check instantiate went okay
      var failed = Common.countFailedProposalResponses(instantiateResponse[0]);
      //TODO Find endorsement policy and see if enough passed to continue.
      if(failed > 0){
        logger.info(failed + " bad responses from instantiate requests");
        //Pass back failed instantiateResponses to client
        var resp = {}
        resp.peerResponses = instantiateResponse;
        return Promise.resolve(resp);
      }
      logger.debug("postChannelsChannelNameChaincodes() - proposed okay, sending to orderer");
      var tranRequest = {};
      tranRequest.proposalResponses = instantiateResponse[0];
      tranRequest.proposal = instantiateResponse[1];
      //7. Once the proposal results are available we can send to the orderer.
      return theChannel.sendTransaction(tranRequest);
    }).then( (ordererResponse)=>{
      //REST caller may need to know txId for later query
      ordererResponse.txId = request.txId;
      return Promise.resolve(ordererResponse);
    }).catch((err)=>{
      logger.debug("postChannelsChannelNameChaincodes() - Error caught");
      if(err instanceof Error && !err.statusCode) err.statusCode = 501;
      return Promise.reject(err);
    });
  }


  /**
   * Instantiate an update to existing chaincode proposal
   * @param {string} channelName Name of the channel
   * @param {integer[]} peers optional index(es) into datasources.json peers array to request endorsement from.
   * @param {chaincodeInstantiate} chaincode The data needed to instantiate chaincode on the channel
   * @param {object} lbConnector The loopback connector object
   *
   * @returns {Promise} Resolving to the result
   */
  putChannelsChannelNameChaincodes(channelName, peers, chaincode, lbConnector){
    // Check that chaincode exists, then do the same as postChannelsChannelNameChaincodes.
    var request = {};
    var theClient;
    var theChannel;

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("putChannelsChannelNameChaincodes() - created client instance");
      theClient = aClient;
      //2. Get the Channel to instantiate chaincode on
      theChannel = aClient.getChannel(channelName);
      //3. Channel must be initialized to instantiate chaincode.
      return theChannel.initialize();
    }).then( (ignored)=>{
      //4. Check if chaincode exists on channel, return 404 if not as nothing to upgrade.
      return theChannel.queryInstantiatedChaincodes();
    }).then( (instantiatedChaincodes) =>{
      logger.debug("putChannelsChannelNameChaincodes() - queried chaincodes okay");
      var id = chaincode.chaincodeId;
      var foundIndex = -1;
      //5. Loop through response and if no matche found reject with "Not Found", 404
      if(instantiatedChaincodes.chaincodes && instantiatedChaincodes.chaincodes.length > 0){
        instantiatedChaincodes.chaincodes.forEach( function(aChaincode,index){
            if(aChaincode.name === id){
              foundIndex = index;;
            };
          }
        )
      }
      if(foundIndex >= 0){
        return Promise.resolve(instantiatedChaincodes.chaincodes[foundIndex]);
      } else {
        logger.debug("putChannelsChannelNameChaincodes() - chaincode not instantiated: " + id);
        var err = new Error("Not Found");
        err.statusCode = 404;
        return Promise.reject(err);
      }
    }).then( (found)=>{
      // Chaincode exists so okay to try and update it.
      logger.debug("putChannelsChannelNameChaincodes() - chaincode found, proposing update");
      //6. build txId
      request = chaincode;
      request.txId = theClient.newTransactionID();

      //7. Propose it
      return theChannel.sendUpgradeProposal(request);

    }).then( (upgradeResponse)=>{
      //6 Check instantiate went okay
      var failed = Common.countFailedProposalResponses(upgradeResponse[0]);
      //TODO Find endorsement policy and see if enough passed to continue.
      if(failed > 0){
        logger.info(failed + " bad responses from upgrade requests");
        //Pass back failed instantiateResponses to client
        var resp = {}
        resp.peerResponses = upgradeResponse;
        return Promise.resolve(resp);
      }
      logger.debug("putChannelsChannelNameChaincodes() - proposed okay, sending to orderer");
      var tranRequest = {};
      tranRequest.proposalResponses = upgradeResponse[0];
      tranRequest.proposal = upgradeResponse[1];
      //8. Once the proposal results are available we can send to the orderer.
      return theChannel.sendTransaction(tranRequest);
    }).then( (ordererResponse)=>{
      //REST caller may need to know txId for later query
      ordererResponse.txId = request.txId;
      return Promise.resolve(ordererResponse);
    }).catch((err)=>{
      logger.debug("putChannelsChannelNameChaincodes() - Error caught");
      if(err instanceof Error && !err.statusCode) err.statusCode = 501;
      return Promise.reject(err);
    });

  }

  /**
   * Transaction proposal
   * @param {string} channelName Name of the channel
   * @param {integer[]} peers optional index(es) into datasources.json peers array to request endorsement from.
   * @param {transaction} transaction The transaction to commit and any proposal response.
   * @param {object} lbConnector The loopback connector object
   *
   * @returns {Promise}
   */
  postChannelsChannelNameEndorse(channelName, peers, transaction, lbConnector){
    var errMsg = "";
    var response = {};

    //Check key fields were passed in.
    if(transaction.proposal === undefined){errMsg = "proposal"}
    else {
      if(transaction.proposal.chaincodeId === undefined){errMsg = "proposal.chaincodeId "}
      if(transaction.proposal.args === undefined){
        errMsg = errMsg+"proposal.args";
      }
    }
    if(errMsg.length > 0) return Promise.reject("Missing parameters: "+errMsg);

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient)=>{
      //2. Once the client is configured set theChannel instance to use later.
      logger.debug("postChannelsChannelNameEndorse() - getting the channel");
      var theChannel = aClient.getChannel(channelName);

      //3. Do endorsement
      // Resolve step with https://fabric-sdk-node.github.io/global.html#TransactionRequest

      logger.debug("postChannelsChannelNameEndorse() - Endorsement");
      var endorseRequest = transaction.proposal;
      // Generate a transaction ID if needed.
      if(transaction.proposal.txId === undefined){
        endorseRequest.txId = aClient.newTransactionID();
      }
      // Now request endorsement
      return Common.sendTxProposal(theChannel,endorseRequest);
    }).catch((err)=>{
      logger.debug("postChannelsChannelNameEndorse() - Error caught");
      if(err instanceof Error && !err.statusCode) err.statusCode = 501;
      return Promise.reject(err);
    });

  }

  /**
   * Commit a transaction, if no proposal responses propose and commit.
   * @param {string} channelName Name of the channel
   * @param {transaction} transaction The transaction to commit and any proposal response.
   * @param {object} lbConnector The loopback connector object
   *
   * @returns {Promise}
   */
  postChannelsChannelNameTransactions(channelName, transaction, lbConnector){
    var errMsg = "";
    var response = {};
    var theChannel;
    var txId;

    //Check key fields were passed in.
    if(transaction.proposal === undefined){errMsg = "proposal"}
    else if(transaction.proposal.header !== undefined){
      // If a header property exists this is an endorsement repsonse passed through
      logger.debug("postChannelsChannelNameTransactions() - proposal is a Buffer");
      /*TODO allow this once the sdk allows data only input to sendTransaction()
       *     OR the objects can be stored across REST client requests
       *     OR the data can be easily turned back into the right objects
       */
      var err = new Error("ProposalResponses passed over REST are not supported at this time");
      err.statusCode = 501;
      return Promise.reject(err);
    }
    else {
      if(transaction.proposal.chaincodeId === undefined){errMsg = "proposal.chaincodeId "}
      if(transaction.proposal.args === undefined){
        errMsg = errMsg+"proposal.args";
      }
    }
    if(errMsg.length > 0) return Promise.reject("Missing parameters: "+errMsg);

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient)=>{
      //2. Once the client is configured set theChannel instance to use later.
      logger.debug("postChannelsChannelNameTransactions() - getting the channel");
      theChannel = aClient.getChannel(channelName);

      //3. Do endorsement if needed
      // Resolve step with https://fabric-sdk-node.github.io/global.html#TransactionRequest
      // If nothing in proposalResponses as array or single ProposalResponse do endorsement first.
      if(transaction.proposalResponses === undefined
        || (transaction.proposalResponses.length === 0 && transaction.proposalResponses.payload === undefined)
      ){
        logger.debug("postChannelsChannelNameTransactions() - Endorsement needed");
        var endorseRequest = transaction.proposal;
        // Generate a transaction ID if needed.
        if(transaction.proposal.txId === undefined){
          txId = aClient.newTransactionID();
          endorseRequest.txId = txId;
        }
        // Now request endorsement
        return Common.sendTxProposal(theChannel,endorseRequest);
      } else {
        logger.debug("postChannelsChannelNameTransactions() - NO endorsement");
        // Need to convert data only proposal input into the object the SDK expects
        //TODO Work out how or get SDK updated.

        return Promise.resolve(transaction);
      }
    }).then( (tranReq)=>{
      //5. Once the proposal results are available we can sendTransaction.
      return theChannel.sendTransaction(tranReq);
    }).then( (broadcastResponse)=>{
      //6. Format out the status returned on the broadcastResponse.status fields
      var finalResp = {};
      finalResp.status = broadcastResponse.status;
      finalResp.txId = txId;
      logger.debug(JSON.stringify(finalResp));
      if(broadcastResponse.status === "SUCCESS"){
        return Promise.resolve(finalResp);
      } else {
        return Promise.reject(finalResp);
      }
    }).catch((err)=>{
      logger.debug("postChannelsChannelNameTransactions() - Error caught");
      if(err instanceof Error && !err.statusCode) err.statusCode = 501;
      return Promise.reject(err);
    });

  }

  /**
  * @param {object} lbConnector The loopback connector object
  *
  * @returns Promise
  */
  getChannels(lbConnector){
    var clientPromise = Common.getClient(lbConnector.settings);
    var peerPromise   = Common.getPeer(lbConnector.settings);

    //Once we have both Client and Peer query the Peer for the known Channels
    return Promise.all([clientPromise,peerPromise]).then(
      (data)=>{
        // Assigning to vars for readability
        var aClient = data[0];
        var aPeer = data[1];

        // Query the Peer for known channels
        return aClient.queryChannels(aPeer);
      }
    ).then(
        (response)=>{
          //console.log(">> result");
          //Expected response from queryChannels call is a ChannelQueryResponse proto Object
          return Promise.resolve(response);
        }
    ).catch((error)=>{
        //Failed to perform function log error and reject promise
        logger.error("Failed to queryChannels: "+ error);
        return Promise.reject(error);
      }
    );

  }

  /**
  * @returns {Promise}
  *
  * @param {string} channelName Name of the channel to GET
  * @param {object} lbConnector The loopback connector object
  */
  getChannelsChannelName(channelName, lbConnector){
    var response = {};

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("getChannelsChannelName() - created client instance");
      //3. Initialize the Channel and query it's Info
      var theChannel = aClient.getChannel(channelName);
      theChannel.initialize();
      response = theChannel;
      return theChannel.queryInfo();
    }).then( (channelInfo) =>{
      logger.debug("getChannelsChannelName() - queried channel okay");
      //Remove the _clientContext property from the Channel to avoid cyclic references in JSON response.
      // If the Client is ever persisted across requests this delete could cause problems.
      delete response._clientContext;
      //4. Resolve with Channel and the queryInfo
      response.queryInfo = channelInfo;
      return Promise.resolve( response );
    }).catch((err)=>{
      if(err instanceof Error) err.statusCode = 501;
      return Promise.reject(err);
    });
  }

  /**
  * @returns {Promise}
  *
  * @param {string} channelName Name of the channel
  * @param {string} id Name of the chaincode
  * @param {object} lbConnector The loopback connector object
  */
  getChannelsChannelNameChaincodesId(channelName, id, lbConnector){
    var response = {};

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("getChannelsChannelNameChaincodesId() - created client instance");
      //3. Initialize the Channel and query it's chaincodes
      var theChannel = aClient.getChannel(channelName);

      return theChannel.queryInstantiatedChaincodes();
    }).then( (installedChaincodes) =>{
      logger.debug("getChannelsChannelNameChaincodesId() - queried chaincodes okay");
      //4. Loop through response and if a name matches set the response to that else {} returned.
      if(installedChaincodes.chaincodes && installedChaincodes.chaincodes.length > 0){
        installedChaincodes.chaincodes.forEach( function(aChaincode,index){
          if(aChaincode.name && aChaincode.name === id){
            response = aChaincode;
          };
        }
        )
      }
      return Promise.resolve( response );
    }).catch((err)=>{
      if(err instanceof Error) err.statusCode = 501;
      return Promise.reject(err);
    });
  }

  /**
  * @returns {Promise}
  *
  * @param {string} channelName Name of the channel
  * @param {object} lbConnector The loopback connector object
  */
  getChannelsChannelNameChaincodes(channelName, lbConnector){
    var response = {};

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("getChannelsChannelNameChaincodes() - created client instance");
      //3. Initialize the Channel and query it's Info
      var theChannel = aClient.getChannel(channelName);
      theChannel.initialize();
      return theChannel.queryInstantiatedChaincodes();
    }).then( (installedChaincodes) =>{
      logger.debug("getChannelsChannelNameChaincodes() - queried channel for chaincode okay");
      response = installedChaincodes; //Indirection not needed here.
      return Promise.resolve( response );
    }).catch((err)=>{
      if(err instanceof Error) err.statusCode = 501;
      return Promise.reject(err);
    });
  }

  /**
  * @returns {Promise}
  *
  * Query the channel's ledger
  * @param {string} channelName Name of the channel
  * @param {string} chaincodeId Chaincode ID to look for
  * @param {integer} blockId Block ID to look for
  * @param {string} blockHash Block Hash to look for
  * @param {string} txnId Transaction ID to look for
  * @param {args} args Optional args for query by chaincode
  * @param {object} lbConnector The loopback connector object
  */
  postChannelsChannelNameLedger(channelName, chaincodeId, blockId, blockHash, txnId, body, lbConnector){
    var response = {};
    var queryRequest = {};
    var queryType = "NOT SET"
    var queryParmCount = 0;
    logger.debug(">postChannelsChannelNameLedger()");

    //Validate that the number of query parameters is valid
    if(chaincodeId !== undefined && chaincodeId !== null){ queryParmCount++; queryType = "chaincodeId"}
    if(blockId !== undefined && blockId !== null){ queryParmCount++; queryType = "blockId"}
    if(blockHash !== undefined && blockHash !== null){ queryParmCount++; queryType = "blockHash"}
    if(txnId !== undefined && txnId !== null){ queryParmCount++; queryType = "txnId"}
    if(queryParmCount > 1 || queryParmCount == 0){
      return Promise.reject("1 query parameter must be used on this request, "+queryParmCount+" found");
    }

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("postChannelsChannelNameLedger() - configured client instance");
      //3. Get the Channel, build request and send it
      var theChannel = aClient.getChannel(channelName);

      if(chaincodeId !== undefined && chaincodeId !== null){
        queryRequest.chaincodeId = chaincodeId;
        if(body !== undefined && body.args !== null && body.fcn !== null){
          queryRequest.args = body.args;
          queryRequest.fcn = body.fcn;
        } else {
          var parmsError = new Error("Either \"args\" or \"fcn\" is missing for chaincode query")
          parmsError.statusCode = 400; //Bad Request
          return Promise.reject(parmsError);
        }
        logger.debug("postChannelsChannelNameLedger query: "+JSON.stringify(queryRequest));
        return theChannel.queryByChaincode(queryRequest);
      } else if(blockId !== undefined && blockId !== null){
        return theChannel.queryBlock(blockId);
      } else if(blockHash !== undefined && blockHash !== null){
        return theChannel.queryBlockByHash(blockHash);
      } else if(txnId !== undefined && txnId !== null){
        return theChannel.queryTransaction(txnId);
      } else {
        return Promise.reject("postChannelsChannelNameLedger unknown query");
      }
    }).then( (queryResult) =>{
      logger.debug("postChannelsChannelNameLedger() - queried channel for " + queryType);
      try{
        response = Common.formatBufferResponse(queryResult[0]);
      } catch(err){
        logger.debug("postChannelsChannelNameLedger() - return 404");
        return Promise.reject(err);
      }
      return Promise.resolve( response );
    }).catch((err)=>{
      if(err instanceof Error && !err.statusCode) err.statusCode = 500;
      return Promise.reject(err);
    });
  }


  /**
  * @returns {Promise}
  *
  * Query a block on a channel by ID or Hash
  * @param {string} channelName Name of the channel
  * @param {string} blockId Query data
  * @param {string} blockHash Query data
  * @param {object} lbConnector The loopback connector object
  */
  getChannelsChannelNameBlocks(channelName, blockId, blockHash, lbConnector){
    var response = {};
    var queryType = "NOT SET"
    var queryParmCount = 0;
    logger.debug(">getChannelsChannelNameBlocks()");

    //Validate that the number of query parameters is valid
    if(blockId !== undefined && blockId !== null){ queryParmCount++; queryType = "blockId"}
    if(blockHash !== undefined && blockHash !== null){ queryParmCount++; queryType = "blockHash"}
    if(queryParmCount > 1 || queryParmCount == 0){
      return Promise.reject("1 query parameter must be used on this request, "+queryParmCount+" found");
    }

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("getChannelsChannelNameBlocks() - configured client instance");
      //3. Get the Channel, build request and send it
      var theChannel = aClient.getChannel(channelName);

      if(blockId !== undefined && blockId !== null){
        return theChannel.queryBlock(blockId);
      } else if(blockHash !== undefined && blockHash !== null){
        return theChannel.queryBlockByHash(blockHash);
      } else {
        return Promise.reject("getChannelsChannelNameBlocks unknown query");
      }
    }).then( (queryResult) =>{
      logger.debug("getChannelsChannelNameBlocks() - queried channel for " + queryType);
      response = queryResult; //Indirection not needed here.
      return Promise.resolve( response );
    }).catch((err)=>{
      if(err instanceof Error && !err.statusCode){
        if(err.message.startsWith("chaincode error (status: 500, message: Failed to get block")){
          //TODO Fragile test, but not much else to go on.
          err.statusCode = 404; //Not Found
        } else {
          err.statusCode = 500; //Internal Server Error
        }
      }
      return Promise.reject(err);
    });
  }


  getChannelsChannelNameTransactionsTransactionID(channelName, transactionID, lbConnector){
    var response = {};
    logger.debug("getChannelsChannelNameTransactionsTransactionID()");

    //1. Get a new client instance.
    return Common.getClientWithChannels(lbConnector.settings).then( (aClient) =>{
      logger.debug("getChannelsChannelNameTransactionsTransactionID() - configured client instance");
      //3. Get the Channel, build request and send it
      var theChannel = aClient.getChannel(channelName);

      return theChannel.queryTransaction(transactionID);
    }).then( (queryResult) =>{
      logger.debug("getChannelsChannelNameTransactionsTransactionID() - queried channel for " + transactionID);
      response = queryResult; //Indirection not needed here.
      return Promise.resolve( response );
    }).catch((err)=>{
      if(err instanceof Error && !err.statusCode){
        if(err.message.startsWith("chaincode error (status: 500, message: Failed to get transaction with id")){
          //TODO Fragile test, but not much else to go on.
          err.statusCode = 404; //Not Found
        } else {
          err.statusCode = 500; //Internal Server Error
        }
      }
      return Promise.reject(err);
    });
  }

};

module.exports = HFCSDKConnector;
