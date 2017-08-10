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

 const Client = require('fabric-client/lib/Client');
 const Channel = require('fabric-client/lib/Channel');
 const Peer = require('fabric-client/lib/Peer');
 const Orderer = require('fabric-client/lib/Orderer');
 const User = require('fabric-client/lib/User');

 const fs = require('fs');

 //This module requires fabric-client so safe to use the same logger as set for sdk.
 const sdkutils = require('fabric-client/lib/utils');
 var logger = sdkutils.getLogger('fabric-client/lib/Common.js');

//Use this file for common utility functions

/**
* Check proposalResponses and return number that failed.
*
* @param {proposalResponses} proposalResponses The responses from a proposal
* @returns {integer} The number of responses with.
*/
exports.countFailedProposalResponses = function(proposalResponses){
  var failedCount = 0;
  var all_good = true;
  //Do some internal checking to help debug.
  for (var i in proposalResponses) {
    if (proposalResponses && proposalResponses[i].response &&
      proposalResponses[i].response.status === 200) {
      logger.info("Proposal was good, peer index is " + i);
    } else {
      logger.error("Proposal was bad, peer index is " + i);
      failedCount += 1;
    }
  }
  if (failedCount == 0) {
    logger.info("Successfully sent Proposal and received ProposalResponse: Status - 200");
  } else {
    logger.debug("Failed to send Proposal or receive valid response. Response null or status is not 200.");
    logger.debug( JSON.stringify(proposalResponses) );
  }
  return failedCount;
}

/**
* Get a new {Client} that has been configured.
*
* @param {Object} settings The settings passed to the loopback connector
* @returns {Promise} A Promise containing the new {Client} that has been configured with a
*                    default User context that is created here using the settings, and the
*                    Orderer is set.
*/
var getClient = function(settings){
  //TODO change from using 1 configured User from datasources.json

  // Options for a file key store
  var keyStoreOpts = {
    path: settings.keyStoreFile,
  };

  // Create a new {Client} instance
  var aClient = new Client();

  // Create and set the state store for the SDK
  return Client.newDefaultKeyValueStore(keyStoreOpts).then(
    (store) => {
      aClient.setStateStore(store);
      // Set the user context for the {Client} from the information in datasources.json
      // and return the Promise that does that work.
      return aClient.createUser(settings.fabricUser);
    }
  ).then(
    (userData)=>{
      //Successfully configured return aClient
      return Promise.resolve(aClient);
    }
  ).catch((err)=>{
    logger.error(err);
    return Promise.reject(err);
  });
}
exports.getClient = getClient;

/**
* Get a new {Client} that has been configured with Channel information from
* datasources.json.
*
* @param {Object} settings The settings passed to the loopback connector
* @returns {Promise} A Promise containing the new {Client} that has been configured with a
*                    default User context that is created here using the settings,the
*                    Orderer is set, and Channels added.
*/
exports.getClientWithChannels = function(settings){
  //1. Get a new Client instance.
  return getClient(settings).then( (aClient)=>{
    //2. Add the channel configuration to the client instance.
    logger.debug("getClientWithChannels() - adding Channels to client instance");
    return addChannelsToClient(aClient,settings);
  }).catch((err)=>{
    logger.error(err);
    return Promise.reject(err);
  });
}

/**
* Get a new {Peer} that has been configured.
*
* @param Object settings The settings passed to the loopback connector
* @returns {Promise} Containing the new Peer
*/
exports.getPeer = function(settings){
  if(settings.peers !== undefined && settings.peers !== null){
    //Get org from datasources.json
    var orgIndex = settings.peers[0].orgIndex;
    let opts = {};
    // Set the PEM to be the org's CACertFile
    opts.pem = fs.readFileSync(settings.orgs[orgIndex].CACertFile,'utf-8');
    //console.log(opts.pem);
    //TODO Do the following better!
    if(settings.peers[0].hostname!== undefined && settings.peers[0].hostname !== null){
      //Set ssl-target-name-override to let tls work in test environment
      opts['ssl-target-name-override'] = settings.peers[0].hostname;
    }
    var peerUrl = settings.peers[0].requestURL;
    if(!peerUrl.startsWith("grpc://") && !peerUrl.startsWith("grpcs://") ){
      logger.debug("Adding grpc:// prefix to "+ peerUrl);
      peerUrl = "grpc://"+peerUrl;
    }
    logger.debug("Connecting to Peer: "+peerUrl);
    return Promise.resolve(new Peer(peerUrl,opts));
  } else {
    return Promise.reject("peers[0] not configured in datasources.json");
  }

}

/**
* Get the array of {Peer}s that have been configured.
*
* @param {Object} settings The settings passed to the loopback connector
* @param {integer[]} peersIndex Optional array of indexes into the peer configuration.
*
* @returns {Promise} Resolving to an array of {Peer}s
*/
var getPeers = function(settings,peersIndex){
  var subset = false;
  var resultLength = 0;
  if(peersIndex !== undefined && peersIndex.length > 0){
    subset = true;
    resultLength = peersIndex.length;
    logger.debug("getPeers() peersIndex: "+peersIndex.toString());
  }

  if(settings.peers !== undefined && settings.peers !== null){
    if(resultLength == 0){
      resultLength = settings.peers.length;
    }
    var resultArray = new Array(resultLength);
    var outputIndex = 0;
    settings.peers.forEach( function(aPeer,index){
      // Skip this if a subset of peers specified and this element not requested.
      if(subset && peersIndex.indexOf(index) === -1) {
        return;
      };
      //Get org from datasources.json
      var orgIndex = aPeer.orgIndex;
      let opts = {};
      // Set the PEM to be the org's CACertFile
      opts.pem = fs.readFileSync(settings.orgs[orgIndex].CACertFile,'utf-8');

      if(aPeer.hostname!== undefined && aPeer.hostname !== null){
        //Set ssl-target-name-override to let tls work in test environment
        opts['ssl-target-name-override'] = aPeer.hostname;
      }
      var peerUrl = settings.peers[index].requestURL;
      if(!peerUrl.startsWith("grpc://") && !peerUrl.startsWith("grpcs://") ){
        logger.debug("Adding grpc:// prefix to "+ peerUrl);
        peerUrl = "grpc://"+peerUrl;
      }
      logger.debug("Peer found: " + peerUrl);
      resultArray[outputIndex] = new Peer(peerUrl,opts);
      outputIndex++; //Safe as forEach processes one element at a time.
    });
    return Promise.resolve(resultArray);
  } else {
    return Promise.reject("peers[0] not configured in datasources.json");
  }
}
exports.getPeers = getPeers;

/************************************************************************
* The node SDK currently requires Channel configuration to occur during an
* application's bootstrap phase rather than query the blockchain network for it.
* See Client.js for more information.
*************************************************************************/

/**
* Read Channel configuration from settings and add them to the Client.
*
* @param Object settings The settings passed to the loopback connector
* @returns {Promise} Resolving to the configured {Client}
*/
var addChannelsToClient = function(aClient, settings){

  var orderersPromise = getOrderers(settings);
  var peersPromise = getPeers(settings);

  //1. Get configured Peers
  return Promise.all([peersPromise,orderersPromise]).then( (data)=>{
      var pArray = data[0];
      var oArray = data[1];

      //2. Loop through configured Channels and add them to the Client.
      settings.channels.forEach( function(channelConfig,cIndex){
          //2.1 Create a new channel in the client.
          var newChannel = aClient.newChannel(channelConfig.name);
          //2.2 Loop through the peers defined for the channel and add them.
          channelConfig.peersIndex.forEach(function(peerArrayIndex,pIndex){
            if(peerArrayIndex >= pArray.length){
              throw new Error("Channel "+channelConfig.name+" references peer with index "+peerArrayIndex);
            };
            newChannel.addPeer(pArray[peerArrayIndex]);
          });
          //2.3 Loop through the orderers defined for the channel and add them.
          channelConfig.orderersIndex.forEach(function(ordererArrayIndex,oIndex){
            if(ordererArrayIndex >= oArray.length){
              throw new Error("Channel "+channelConfig.name+" references orderer with index "+ordererArrayIndex);
            };
            newChannel.addOrderer(oArray[ordererArrayIndex]);
          });
          //TODO Consider whether to initialize the channel too.
      });
      //3. Return the Client instance that was passed in.
      return Promise.resolve(aClient);
    }
  ).catch((err)=>{
    return Promise.reject("Failed to configure channels: "+ err);
  });

}
exports.addChannelsToClient = addChannelsToClient;

/*
* A Basic validation routine to check that the main configuration settings are there.
*/
exports.validateSettings = function(settings){
  var errorCount = 0;
  if(settings.channels === undefined || settings.channels === null
    || settings.channels.length == 0){
    logger.error("No channels defined in datasources.json.");
    errorCount++;
  };
  if(settings.peers === undefined || settings.peers === null
    || settings.peers.length == 0){
    logger.error("No peers defined in datasources.json.");
    errorCount++;
  };
  if(settings.orderers === undefined || settings.orderers === null
    || settings.orderers.length == 0){
    logger.error("No orderers defined in datasources.json.");
    errorCount++;
  };
  if(settings.orgs === undefined || settings.orgs === null
    || settings.orgs.length == 0){
    logger.error("No orgs defined in datasources.json.");
    errorCount++;
  };
  // if(settings.keyStoreFile === undefined || settings.keyStoreFile === null){
  //   logger.error("No keyStoreFile defined in datasources.json.");
  //   errorCount++;
  // };
  if(settings.fabricUser === undefined || settings.fabricUser === null){
    logger.error("No fabricUser defined in datasources.json.");
    errorCount++;
  };
  if(errorCount>0){
    logger.debug("Settings:\n"+JSON.stringify(settings));
  }
  return errorCount;
}

/**
* Get a new {Orderer} that has been configured.
*
* @param Object settings The settings passed to the loopback connector
* @returns {Promise} Resolving to the new Orderer
*/
exports.getOrderer = function(settings){
  if(settings.orderers !== undefined && settings.orderers !== null){
    logger.debug("Orderer is " + settings.orderers[0].url);
    let opts = {};
    opts.pem = fs.readFileSync(settings.orderers[0].CACertFile,'utf-8');
    //opts.pem = fs.readFileSync(settings.fabricCA.publicCertFile,'utf-8');
    //TODO Do the following better!
    //Set ssl-target-name-override to let it work in test environment
    opts['ssl-target-name-override'] = settings.orderers[0].hostname;

    var ordererUrl = settings.orderers[0].url;
    if(!ordererUrl.startsWith("grpc://") && !ordererUrl.startsWith("grpcs://") ){
      logger.debug("Adding grpc:// prefix to "+ ordererUrl);
      ordererUrl = "grpc://"+ordererUrl;
    }
    logger.debug("Orderer found: " + ordererUrl);
    return Promise.resolve(new Orderer(ordererUrl,opts));
  } else {
    return Promise.reject("orderers[0] not configured in datasources.json");
  }

}

/**
* Get the array of {Orderer}s that have been configured.
*
* @param Object settings The settings passed to the loopback connector
* @returns {Promise} Resolving to an array of {Orderer}s
*/
var getOrderers = function(settings){
  if(settings.orderers !== undefined && settings.orderers !== null){
    var resultArray = new Array(settings.orderers.length);
    settings.orderers.forEach( function(anOrd,index){
      let opts = {};
      // Set the PEM to be the org's CACertFile
      opts.pem = fs.readFileSync(anOrd.CACertFile,'utf-8');

      if(anOrd.hostname!== undefined && anOrd.hostname !== null){
        //Set ssl-target-name-override to let tls work in test environment
        opts['ssl-target-name-override'] = anOrd.hostname;
      }
      var ordererUrl = settings.orderers[0].url;
      if(!ordererUrl.startsWith("grpc://") && !ordererUrl.startsWith("grpcs://") ){
        logger.debug("Adding grpc:// prefix to "+ ordererUrl);
        ordererUrl = "grpc://"+ordererUrl;
      }
      logger.debug("Orderer found: " + ordererUrl);
      resultArray[index] = new Orderer(ordererUrl,opts);
    });
    return Promise.resolve(resultArray);
  } else {
    return Promise.reject("orderers[0] not configured in datasources.json");
  }
}
exports.getOrderers = getOrderers;

/**
*
* @param {Channel} channel to send the proposal to
* @param {object} request See https://fabric-sdk-node.github.io/global.html#ChaincodeInvokeRequest
*
* @returns {object} See https://fabric-sdk-node.github.io/global.html#TransactionRequest
*/
exports.sendTxProposal = function(channel,endorseRequest){
  return channel.sendTransactionProposal(endorseRequest).then((ProposalResponseObject)=>{
    var tranRequest = {};
    tranRequest.proposalResponses = ProposalResponseObject[0];
    //Docs say it should be tranRequest.chaincodeProposal
    tranRequest.proposal = ProposalResponseObject[1];
    logger.debug("sendTxProposal() resolved - "+JSON.stringify(tranRequest));
    return Promise.resolve(tranRequest);
  }).catch((err)=>{
    return Promise.reject(err);
  });
}


/**
* Send transaction to the orderer. If no proposal responses are passed in it will
* do the proposal step first and then, if successful, send the transaction to the
* orderer.
*
* @param {Channel} channel to send the proposal to
* @param {Object[]} A proposalObject. See buildTxProposal.
* @param {ProposalResponse[]} Optional array of ProposalResponses.
* @returns {Promise} Resolving to the ProposalResponse
*/
exports.sendTx = function(channel,proposalObj,proposalResponses){
  var propArrayPromise;
  if(proposalResponses === undefined || proposalResponses === null
     || proposalResponses.length == 0 ){
    //No proposal responses, start from the beginning of the TXN lifecycle.
    // Resolves with a https://fabric-sdk-node.github.io/global.html#ProposalResponseObject
    propArrayPromise = channel.sendTransactionProposal(proposalObj);
  } else {
    //Proposal responses passed in so resolve immediately with them.
    propArrayPromise = Promise.resolve(proposalResponses);
  };

  //Once we have the array of proposal responses send them to the orderer.
  return propArrayPromise.then((propArray)=>{
    return channel.sendTransactionProposal(propArray,proposal);
  }).catch((err)=>{
    return Promise.reject(err);
  });
}

/**
*
* @throws {Error} Throws a Not Found error with a statusCode of 404 when a Buffer exists but is empty.
*/
exports.formatBufferResponse = function(response){
  var resp = {};
  if(response instanceof Buffer){
    // Turn the Buffer into a parsable string.
    var respJSON = response.toString();
    logger.debug(respJSON);
    //If decoded buffer looks like a JSON object or array send that as the response.
    // TODO Validate that this is the right approach.
    if(respJSON.startsWith("{")) {
      // Indirection used to stop JSON.parse result being converted to a string.
      resp = JSON.parse(respJSON);
      return resp;
    }
    else if(respJSON.startsWith("[")){
      logger.debug("formatBufferResponse() - wrapper Array response");
      resp.queryResult = JSON.parse(respJSON);
      return resp;
    }
    else if(respJSON === ("")){
      logger.debug("formatBufferResponse() - empty response");
      var error = new Error("Not Found");
      error.statusCode = 404;
      throw error;
    }
    else {
      // else just return Buffer as is.
      logger.debug("formatBufferResponse() - Return Buffer as contents does not look like JSON");
      return response;
    };
  } else {
    logger.debug("formatBufferResponse() - Not a Buffer");
    return response;
  }
}

var reconnect = function(channel,callback){
  //TODO
};
