var GPIO = require('./gpio'),
    Client = require('./client'),
    RFIDReader = require('./RFIDReader'),
    parseJson = require('./parseJson')

module.exports = exports = {
  //
  // GPIO
  //
  gpio: GPIO,
  loadGPIOConfig: GPIO.loadConfig,
  normalizeGPIOConfig: GPIO.normalizeConfig,
  GPIO: GPIO.GPIO,

  //
  // Client
  //
  client: Client,
  loadClientConfig: Client.loadConfig,
  normalizeClientConfig: Client.normalizeConfig,
  createClient: Client.createClient,

  //
  // RFIDReader
  //
  rfidReader: RFIDReader,
  loadRFIDReaderConfig: RFIDReader.loadConfig,
  normalizeRFIDReaderConfig: RFIDReader.normalizeConfig,
  RFIDReader: RFIDReader.RFIDReader

  //
  // LinuxLockPi#loadConfig(path,done)
  //
  //   Parameters:
  //     path: An absolute path. Should point to a JSON file.
  //
  //     done: A callback, with signature done(err, config), which allows the
  //           routine to be used in routines provided by the 'async' module.
  //           This parameter is optional, and omitting it will result in a
  //           synchronous behaviour.
  //
  //   Returns: Object
  //
  //   Description: Load a configuration for each component of the application,
  //   from a single JSON document. Each item is normalized by default.
  //
  loadConfig: function(path, done) {
    // Async if done isn't falsy
    var async = !!done, finished = false, result = {}, cb = done, called = false
    done = function(err, config) {
      if(!called) {
        called = true
        if(cb) return cb(err,config)
        finished = true
        if(err) throw err
        else result = config
      }
    }

    parseJson(path, function(err, originalJson) {
      var config = { client: {}, rfidReader: {}, gpio: {} }
      if(err) return done(err)

      if(typeof originalJson.client === "string")
        Client.loadConfig(originalJson.client, function(err, conf) {
          if(err) return done(err)
          config.client = conf
        })
      else if(typeof originalJson.client === "object")
        Client.normalizeConfig(originalJson.client, function(err, conf) {
          if(err) return done(err)
          config.client = conf
        })

      if(typeof originalJson.rfidReader === "string")
        RFIDReader.loadConfig(originalJson.rfidReader, function(err, conf) {
          if(err) return done(err)
          config.rfidReader = conf
        })
      else if(typeof originalJson.rfidReader === "object")
        RFIDReader.normalizeConfig(originalJson.rfidReader, function(err, conf) {
          if(err) return done(err)
          config.rfidReader = conf
        })

      if(typeof originalJson.gpio === "string")
        GPIO.loadConfig(originalJson.gpio, function(err, conf) {
          if(err) return done(err)
          config.gpio = conf
        })
      else if(typeof originalJson.gpio === "object")
        GPIO.normalizeConfig(originalJson.gpio, function(err, conf) {
          if(err) return done(err)
          config.gpio = conf
        })

      return done(null, config)
    })

    // If running synchronously (no callback), wait for everything to be finished,
    // before returning.
    if(!async) {
      var sync = function() {
        if(!finished)
          setTimeout(sync,0)
      }()
      return result
    }
  }
}
