var vows = require('vows'),
    assert = require('assert'),
    Client = require('../lib/client')

vows.describe('Client').addBatch({
  'loadConfig': {
    'should be a function': {
      topic: function() { return Client.loadConfig },
      'should be a function': function(topic) {
        assert.isFunction(topic, "Client#loadConfig should be a function")
      },
      'absolute file path': function(topic) {
        assert.doesNotThrow(function() { topic(__dirname + '/data/client.json', function(err, json) {
          assert(!err, "should not fail")
          assert.deepEqal(json, {
            "url": "http://www.google.ca:3000",
            "version": "~1.0",
          })
        }) }, "should not throw");
      }
    },
  }
}).export(module)
