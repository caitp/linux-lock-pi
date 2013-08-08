/* jshint asi: true */
var parseJson = require('./parseJson'),
    url = require('url'),
    restify = require('restify')

//
// Client/Server configuration keys:
//
// server: String -- URL for the LinuxLock WebService.
// port: Number -- Optional port number, separate from the server URL
//

//
// Client#normalizeConfig(config, done)
//
//   Parameters:
//     config: Configuration object, either containing a complete
//             linux-lock-pi configuration, or just the 'client' section of
//             one.
//
//     done: A callback, with signature done(err, config), which allows the
//           routine to be used in routines provided by the 'async' module.
//
//   Returns: undefined
//
//
//   Description: Normalize the client configuration of linux-lock-pi.
//
module.exports.normalizeConfig = function(original, done) {
  if(typeof original !== "object")
    throw new TypeError("expected 'object' for parameter 1")
  if(typeof done !== "function")
    throw new TypeError("expected 'function' for parameter 2")

  var originalJson = original
  var config = {}

  if("client" in originalJson && typeof originalJson.client === "object")
    originalJson = originalJson.client

  if(!("server" in originalJson) || "url" in originalJson)
    return done(new Error("Client configuration missing 'server' key or 'url' key"))

  var parsedServer = url.parse(originalJson.server || originalJson.url)
  if("port" in originalJson) {
    var port = originalJson.port
    if(typeof port === "string")
      port = parseInt(port, 10)
    // Use port if we don't already have one specified in the url string,
    // and do have one specified elsewhere in the configuration.
    if(!isNaN(port))
      parsedServer.port = port
  }

  delete parsedServer.host
  config.server = url.format(parsedServer)
  if("version" in originalJson)
    config.version = originalJson.version

  return done(null, config)
}

//
// Client#loadConfig(path, done)
//
//   Parameters:
//     path: An absolute path. Should point to a JSON file.
//
//     done: A callback, with signature done(err, config), which allows the
//           routine to be used in routines provided by the 'async' module.
//
//   Returns: undefined
//
//
//   Description: Load a client/server configuration from a JSON file, and
//   return an object containing the parsed key/values which are pertinent to
//   the client/server module.
//
module.exports.loadConfig = function(path, done) {
  if(typeof path !== "string")
    throw new TypeError("expected 'string' for parameter 1")
  if(typeof done !== "function")
    throw new TypeError("expected 'function' for parameter 2")
  parseJson(path, function(err, originalJson) {
    var config = {}
    if(err) return done(err)
    module.exports.normalizeConfig(originalJson, function(err, config) {
      if(err) return done(err)
      else return done(null, config)
    })
  })
}

//
// Client#createClient(options)
//
//   Parameters:
//     options: A URL string, or an object containing parameters for Restify's
//              JsonClient. Documentation for the JsonClient can be found at
//              https://github.com/mcavage/node-restify/blob/master/README.md
//
//              If 'port' is found in options, it will be formatted into the URL
//              string before being handed to Restify.
//
//
//   Returns: Object (node-restify JsonClient). This Restify client is a
//            customized instance featuring LinuxLock-specific routines:
//            JsonClient#checkRFID(rfidNo)
//
//   Description: Create an instance of a JsonClient, which will interact with
//   the LinuxLock JSON web service / API.
//
module.exports.createClient = function(options) {
  var client
  options = options || {}
  if(typeof options === "string")
    options = { url: options }
  else if(typeof options === "object") {
    if(!(options.server || options.url))
      throw new Error("Missing 'server' or 'url'")
    var parsedServer = url.parse(options.server || options.url)
    if("port" in options) {
      var port = options.port
      if(typeof port === "string")
        port = parseInt(port, 10)
      // Use port if we don't already have one specified in the url string,
      // and do have one specified elsewhere in the configuration.
      if(!isNaN(port) && !parsedServer.host)
        parsedServer.port = port
    }
    options.url = url.format(parsedServer)
  }
  else throw new TypeError("Expected String or Object for parameter 1")
  options.version = options.version || "~1.0"
  client = restify.createJsonClient(options)

  // Bind APIs
  //
  // Client#checkRFID(rfidNo)
  //
  //   Parameters:
  //     rfidNo: A string containing a deserialized RFID tag, which shall be URL
  //             encoded and passed to the LinuxLock JSON Web Service, in order 
  //             to determine whether or not the card is authorized.
  //
  //   Returns: undefined
  //
  //   Description: Sends a request to the web service, which shall in turn emit
  //   either an 'authorized' event, or an 'unauthorized' event. The event data 
  //   for these events shall contain the deserialized RFID tag under 'tag', 
  //   and the type 'rfid', EG "{type: 'rfid', tag: '01AB9607AD'}"
  //
  //   This routine is not exported, but is bound to the JsonClient on creation.
  //   As such, 'this' should always be valid.
  //
  client.checkRFID = function(rfidNo) {
    client.get('/api/auth/rfid/'+encodeURIComponent(rfidNo)+'.json',
    function(err,req,res,obj) {
      if(err && (!obj || typeof obj.auth === "undefined")) {
        console.log("Unexpected response: " + res + "("+err+")")
        obj = {auth: false}
      }
      var eventArg = { type: 'rfid', tag: rfidNo }
      if(obj.auth) client.emit('authorized', eventArg)
      else client.emit('unauthorized', eventArg)
    })
  }

  return client
}
