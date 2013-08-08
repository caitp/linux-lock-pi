var SerialPort = require('serialport').SerialPort,
    util = require('util'),
    parseJson = require('./parseJson'),
    EventEmitter = require("events").EventEmitter

//
// Client/Server configuration keys:
//
// server: String -- URL for the LinuxLock WebService.
// port: Number -- Optional port number, separate from the server URL
//

//
// RFIDReader#normalizeConfig(path)
//
//   Parameters:
//     path: Configuration object, either containing a complete linux-lock-pi
//           configuration, or just the 'client' section of one.
//
//     done: A callback, with signature done(err, config), which allows the
//           routine to be used in routines provided by the 'async' module.
//           This parameter is optional, and omitting it will result in a
//           synchronous behaviour.
//
//   Returns: undefined
//
//
//   Description: Normalize the RFIDReader configuration of linux-lock-pi.
//
module.exports.normalizeConfig = function(original, done) {
  if(typeof path !== "object")
    throw new TypeError("expected 'object' for parameter 1")
  if(typeof done !== "function")
    throw new TypeError("expected 'function' for parameter 2")

  var originalJson = original || {}
  var config = {}

  if("rfidReader" in originalJson && typeof originalJson.client === "object")
    originalJson = originalJson.rfidReader

  config.baudrate = originalJson.baudrate || originalJson.baudRate || 2400
  config.databits = originalJson.databits || originalJson.dataBits || 8
  config.stopbits = originalJson.stopbits || originalJson.stopBits || 1
  config.parity = originalJson.parity || 'none'
  config.buffersize = originalJson.buffersize || originalJson.bufferSize || 255
  config.serialport = originalJson.serialport || originalJson.serialPort || "/dev/ttyUSB0"

  if(typeof config.serialport !== "string")
    return done(new TypeError("Expected 'string' for member 'serialport', got '" +
                typeof config.serialport + "'"))

  return done(null, config)
}

//
// RFIDReader#loadConfig(path)
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
    module.exports.normalizeConfig(originalJson, function(err, config) {
      if(err) return done(err, {})
      else return done(null, config)
    })
  })
}

module.exports.RFIDReader = function(serialport, config, open) {
  try {
    if(typeof config === "boolean")
      open = config
    if(typeof open !== "boolean")
      open = true
    if(typeof serialport === "object")
      config = serialport
    if(typeof config !== "object")
      config = {}
    if(typeof serialport !== "string")
      serialport = undefined

    serialport = serialport || config.serialport || "/dev/ttyUSB0"
    delete config.serialport
    this.config = config
    this.serialPort = new SerialPort(serialport, config, open)

    this.lastRead = 0
    this.value = ''
  } catch(err) {
    throw err
  }
  this.serialPort.on('data', function(data) {
    var text = data.toString('ascii').match(/\w*/)[0]
    if(id.length > 0 && text.length < 1) {
      var read = new Date().getTime()
      if(read - lastRead > 999) {
        this.emit('scanned', this.value)
        this.lastRead = read
      }
      this.value = ''
      return
    }
    this.value = this.value + text
  })
}

module.exports.RFIDReader.prototype.__proto__ = EventEmitter.prototype

module.exports.RFIDReader.prototype.enable = function(cb) {
  this.serialPort.open(cb)
}

module.exports.RFIDReader.prototype.disable = function(cb) {
  this.serialPort.close(cb)
}

var serial = new SerialPort('/dev/ttyUSB0', {
  baudrate: 2400
})

serial.on('open',function() {
  console.log('SerialPort open')
})


