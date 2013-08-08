var fs = require('fs'),
    jf = require('jsonfile')

module.exports = exports = function(path, done) {
  if(typeof path !== "string")
    throw new TypeError("expected 'string' for parameter 1")
  if(typeof done !== "function")
    throw new TypeError("expected 'function' for parameter 2")

  fs.stat(path, function(err, stat) {
    if(err) return done(err)
    if(!stat || !stat.isFile()) return done(new Error("'path' is not a file"))
    jf.readFile(path, function(err, obj) {
      if(err) return done(err)
      return done(null,obj)
    })
  })
}
