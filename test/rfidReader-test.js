var vows = require('vows'),
    assert = require('assert'),
    RFIDReader = require('../lib/rfidReader')

vows.describe('RFIDReader').addBatch({
  'loadConfig': {
    'should be a function': {
      topic: function() { return RFIDReader.loadConfig },
      'should be a function': function(topic) {
        assert.isFunction(topic, "RFIDReader#loadConfig should be a function")
      },
      'absolute file path': function(topic) {
        assert.doesNotThrow(function() { topic(__dirname + '/data/rfidReader.json', function(err, json) {
          assert(!err, "should not fail")
          assert.deepEqal(json, {
            "baudRate": 2400
          })
        }) }, "should not throw");
      }
    },
  }
}).export(module)
