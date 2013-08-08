var GPIO = require('./gpio'),
    Client = require('./client'),
    RFIDReader = require('./rfidReader'),
    parseJson = require('./parseJson'),
    util = require('util')

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
  Client: Client,
  loadClientConfig: Client.loadConfig,
  normalizeClientConfig: Client.normalizeConfig,
  createClient: Client.createClient,

  //
  // RFIDReader
  //
  rfidReader: RFIDReader,
  loadRFIDReaderConfig: RFIDReader.loadConfig,
  normalizeRFIDReaderConfig: RFIDReader.normalizeConfig,
  RFIDReader: RFIDReader.RFIDReader,

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
  //   Returns: undefined
  //
  //   Description: Load a configuration for each component of the application,
  //   from a single JSON document. Each item is normalized by default.
  //
  loadConfig: function(path, done) {
    if(typeof path !== "string")
      throw new TypeError("expected 'string' for parameter 1")
    if(typeof done !== "function")
      throw new TypeError("expected 'function' for parameter 2")
    parseJson(path, function(err, originalJson) {
      var config = { client: {}, rfidReader: {}, gpio: {} }
      if(err) return done(err)
      if(util.isArray(originalJson.client))
        originalJson.client = originalJson.client[0]
      originalJson.client = originalJson.client || {}
      if(util.isArray(originalJson.gpio))
        originalJson.gpio = originalJson.gpio[0]
      originalJson.gpio = originalJson.gpio || {}
      if(util.isArray(originalJson.rfidReader))
        originalJson.rfidReader = originalJson.rfidReader[0]
      originalJson.rfidReader = originalJson.rfidReader || {}

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
  }
}
