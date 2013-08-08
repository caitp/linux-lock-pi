var vows = require('vows'),
    assert = require('assert'),
    GPIO = require('../lib/gpio')

vows.describe('GPIO').addBatch({
  'loadConfig': {
    topic: function() { return GPIO.loadConfig },
    'should be a function': function(topic) {
      assert.isFunction(topic, "GPIO#loadConfig should be a function")
    },
    'absolute file path': function(topic) {
      assert.doesNotThrow(function() { topic(__dirname + '/data/gpio.json', function(err, json) {
        assert(!err, "should not fail")
        assert.deepEqal(json, {
          "authorized": {
            "pin": 4,
            "action": {
              "set": 1000
            }
          },
          "unauthorized": {
            "pin": 6,
            "action": {
              "set": 1000
            }
          }
        })
      }) }, "should not throw");
    }
  }
}).export(module)
