var parseJson = require('./parseJson'),
    gpio = require('gpio')

//
// GPIO configuration keys:
//
// Action -- An object describing a GPIO electric action to perform. It has the
//           following keys:
//   "pin": GPIO pin number, representing the pin for which the action is
//          performed
//   "action": Object representing an action or actions to occur for the given
//             pin. Each action key's value represents the length of time, in
//             (in milliseconds) for which it shall be performed. Actions which
//             are permitted include:
//
//             "set" -- Enable the given pin for N milliseconds
//
// "authorized": Action or Array of Actions (see above)
// "unauthorized": Action or Array of Actions (see above)
//

//
// GPIO#normalizeConfig(original, done)
//
//   Parameters:
//     original: Configuration object, either containing a complete
//               linux-lock-pi configuration, or just the 'gpio' section of
//               one.
//
//     done: A callback, with signature done(err, config), which allows the
//           routine to be used in routines provided by the 'async' module.
//           This parameter is optional, and omitting it will result in a
//           synchronous behaviour.
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

  if("gpio" in originalJson && typeof originalJson.gpio === "object")
    originalJson = originalJson.gpio

  config = originalJson

  return done(null, config)
}

//
// GPIO#loadConfig(path)
//
//   Parameters:
//     path: An absolute path. Should point to a JSON file.
//
//     done: A callback, with signature done(err, config), which allows the
//           routine to be used in routines provided by the 'async' module.
//           This parameter is optional, and omitting it will result in a
//           synchronous behaviour.
//
//   Returns: undefined
//
//
//   Description: Load a GPIO configuration from a JSON file, and
//   return an object containing the parsed key/values which are pertinent to
//   the GPIO module.
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
// GPIO#GPIO()
//
//   Returns: Object
//
//
//   Description: Construct a GPIO object, which will issue commands to the Raspberry Pi
//   GPIO headers, using instructions parsed from JSON files.
//
module.exports.GPIO = function() {

}
