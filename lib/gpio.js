var parseJson = require('./parseJson'),
    gpio = require('rpi-gpio'),
    async = require('async'),
    util = require('util')

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
// GPIO#normalizeConfig(config, done)
//
//   Parameters:
//     config: Configuration object, either containing a complete
//             linux-lock-pi configuration, or just the 'gpio' section of
//             one.
//
//     done: A callback, with signature done(err, config), which allows the
//           routine to be used in routines provided by the 'async' module.
//
//   Returns: undefined
//
//
//   Description: Normalize the gpio configuration of linux-lock-pi, by 
//   removing unknown or invalid keys.
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
// GPIO#loadConfig(path, done)
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
//   Returns: Object (instanceof GPIO)
//
//
//   Description: Construct a GPIO object, which will issue commands to the
//   Raspberry Pi GPIO headers, using instructions parsed from JSON files.
//
module.exports.GPIO = function() {
  //
  // GPIO#execute(config)
  //
  // Parameters:
  //   config: An object containing a single GPIO configuration, made up of one 
  //           or more sub-configurations, each of which made up of one or more 
  //           actions (containing one or more verbs).
  //
  // Returns: undefined
  //
  // Description: Executes a set of GPIO instructions, using the following
  // algorithm:
  //
  // If configuration is an array, execute each element (sub-configuration) of
  // the array in parallel. Otherwise, treat the object as a single
  // sub-configuration and execute it.
  //
  // For each sub-configuration, there should be an "action" key. The value of
  // this action key may be an array or object. If it is an array, each element
  // in the array shall be executed in series.
  //
  // If a sub-configuration has a "pin", it shall override the configuration's
  // top-level "pin" value (if one was present). If no pin is specified, then
  // the instruction shall be ignored.
  //
  // An action may specify verbs, each of which shall be executed in parallel.
  // A verb key's value is a time value, indicating the duration (in
  // milliseconds) of the action. The accuracy of the time value is laughable,
  // and should not be relied on for fancy light shows at dance parties or
  // night clubs. Unknown verbs are ignored.
  //
  // Currently, the supported verbs are:
  //
  //   - "set"
  //
  var verbs = [
    "set"
  ]
  this.execute = function(config) {
    if(typeof config === "object") {
      if(!util.isArray(config))
        config = [config]

      //
      // 1. Execute each subconfiguration in parallel
      //
      async.each(config, function(sub, done) {

        //
        // 2. Skip if subconfiguration is not an object
        //
        if(typeof sub !== "object" || util.isArray(sub))
          return done(null)

        //
        // 3. Store default "pin" for subconfiguration, if present.
        //
        var pin = sub.pin || undefined

        //
        // 4. Store subconfiguration action, if present.
        //
        var action = sub.action || undefined
        if(typeof action !== "object")
          return done()

        if(!util.isArray(action))
          action = [action]

        //
        // 5. Execute each subconfiguration action, in series
        //
        async.eachSeries(action, function(act, done) {

          //
          // 6. Abort if 'act' is not an object.
          //
          if(typeof act !== "object" || util.isArray(act))
            return done()

          //
          // 7. Use action's pin temporarily, if one is specified
          //
          var p = act.pin
          if(typeof p === "undefined") p = pin

          //
          // 8. If no pin is specified, abort.
          //
          if(typeof p === "undefined")
            return done()

          // 9. Exececute each supported verb in parallel
          async.every(verbs, function(verb, done) {
            if(typeof act[verb] === "number") {
              // If it's a number, then execute it.
              execVerb[verb](p, act[verb], done)
            } else done()
          }, function(err) {
            //
            // Finished with verbs
            //
            done()
          }) 
        }, function(err) {
          //
          // Finished with actions
          //
          done()
        })
      }, function(err) {
        //
        // Finished with subconfigurations
        //
      })
    }
  }

  //
  // By the time these routines are called, 'pin' and 'time' should be
  // guaranteed to be valid, and 'done' is provided by the (internal)
  // caller itself. So we should be safe.
  //
  var execVerb = {
    //
    // Raise 'pin' for 'time' milliseconds
    //
    "set": function(pin, time, done) {
      gpio.setup(pin, gpio.DIR_OUT, function() {
        gpio.write(pin, true, function(err) {
          if(err) console.log(err)
          setTimeout(function() {
            gpio.write(pin, false, function(err) {
              if(err) console.log(err)
            })
          }, time)
        })
      })
      done()
    }
  }
}
