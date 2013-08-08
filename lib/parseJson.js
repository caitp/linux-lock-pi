var fs = require('fs'),
    RepairStream = require('jsonrepair').RepairStream

var repairRules = [{
    description: 'Removing double commas after values in objects',
    character: ',',
    expected: 'OPEN_KEY',
    action: function(parser) {
      parser.stack.pop();
    }
  },{
    description: 'Removing trailing comma within array',
    character: ']',
    expected: 'VALUE',
    action: function(parser) {
      parser.stack.pop();
      parser.onclosearray();
      var newState = parser.stack.pop();
      parser.state = newState;
    }
  }
]

module.exports = exports = function(path, done) {
  if(typeof path !== "string")
    throw new TypeError("expected 'string' for parameter 1")
  if(typeof done !== "function")
    throw new TypeError("expected 'function' for parameter 2")

  fs.stat(path, function(err, stat) {
    if(err) return done(err)
    if(!stat || !stat.isFile()) return done(new Error("'path' is not a file"))
    var input = fs.createReadStream(path),
        repair = new RepairStream(input),
        json = ""
    repair.on('data', function(data) {
      json += data
    })
    repair.on('close', function() {
      console.log("closed!")
    })
    repair.on('end', function() {
      console.log("JSON: " + json)
      JSON.parse(json, done)
    })
    input.pipe(repair)
  })
}
