var restify = require('restify')
var readline = require('readline')

var SerialPort = require('serialport').SerialPort

var serial = new SerialPort('/dev/ttyUSB0', {
  baudrate: 2400
})

serial.on('open',function() {
  console.log('SerialPort open')
})

// TODO:
// Probably want some configuration file that points to the
// webservice, since we can't expect it to be 192.168.0.18:8080
// all the time.
var client = restify.createJsonClient({
  url: 'http://zenit.senecac.on.ca:9086',
  version: '~1.0'
})

function tryUnlock(id) {
  client.get('/api/auth/rfid/'+id+'.json', function(err,req,res,obj) {
    if(err) console.log(err)
    else if("auth" in obj) {
      if(obj.auth) {
        console.log('Welcome to paradise!')
      } else {
        console.log('Sorry, you\'re not allowed inside :(')
      }
    } else {
      console.log('Unexpected response...')
    }
  })
}

var lastRead = 0
var id = ''
serial.on('data', function(data){
  var text = data.toString('ascii').match(/\w*/)[0]
  if(id.length > 0 && text.length < 1) {
    var read = new Date().getTime()
    if(read - lastRead > 999) {
      tryUnlock(id)
      lastRead = read
    }
    id = ''
    return
  }
  id = id + text
})

