var vows = require('vows'),
    assert = require('assert'),
    parseJson = require('../lib/parseJson')

vows.describe('parseJson').addBatch({
  'parseJson': {
    // This kind of hack really shouldn't be necessary :(
    topic: function() { return parseJson },
    'is a function': function(topic) {
      assert.isFunction(topic)
    },
    'relative file path': {
      'should not load valid json': function(topic) {
        topic('./data/valid.json', function(err, json) {
          assert(!!err, "should throw.")
          assert(err.message === "'path' is not a file", "Should be a file-not-found error" )
          assert(typeof json === "undefined", "json should be undefined. (" + JSON.stringify(json) + ")")
        })
      },
      'should not load invalid json (trailing comma)': function(topic) {
        topic('./data/invalidJsonTrailingComma.json', function(err, json) {
          assert(!!err, "should throw.")
          assert(err.message === "'path' is not a file", "Should be a file-not-found error" )
          assert(typeof json === "undefined", "json should be undefined. (" + JSON.stringify(json) + ")")
        })
      },
      'should not load invalid json (array with trailing comma)': function(topic) {
        topic('./data/invalidArrayTrailingComma.json', function(err, json) {
          assert(!!err, "should throw.")
          assert(err.message === "'path' is not a file", "Should be a file-not-found error" )
          assert(typeof json === "undefined", "json should be undefined. (" + JSON.stringify(json) + ")")
        })
      },
      'should not load invalid json (object with trailing comma)': function(topic) {
        topic('./data/invalidObjectTrailingComma.json', function(err, json) {
          assert(!!err, "should throw.")
          assert(err.message === "'path' is not a file", "Should be a file-not-found error" )
          assert(typeof json === "undefined", "json should be undefined. (" + JSON.stringify(json) + ")")
        })
      }
    },
    'absolute file path': {
      'should load valid json': function(topic) {
        topic(__dirname + '/data/valid.json', function(err, json) {
          assert(!err, "should not throw. (" + err.message + ")")
          assert.deepEqual(json, {
            "array": [1,2,3,4,5],
            "object": {
              "one": 1,
              "two": 2,
              "three": 3,
              "four": 4,
              "five": 5
            },
            "string": "12345"
          }, "should match object literal (got '" + JSON.stringify(json) + "' instead)")
        })
      },
      'should load invalid json (trailing comma)': function(topic) {
        topic(__dirname + '/data/invalidJsonTrailingComma.json', function(err, json) {
          assert(!err, "should not throw. (" + err.message + ")")
          assert.deepEqual(json, {
            "array": [1,2,3,4,5],
            "object": {
              "one": 1,
              "two": 2,
              "three": 3,
              "four": 4,
              "five": 5
            },
            "string": "12345"
          }, "should match object literal (got '" + JSON.stringify(json) + "' instead)")
        })
      },
      'should load invalid json (array with trailing comma)': function(topic) {
        topic(__dirname + '/data/invalidArrayTrailingComma.json', function(err, json) {
          assert(!err, "should not throw. (" + err.message + ")")
          assert.deepEqual(json, { "array": [1,2,3,4,5], },
          "should match object literal (got '" + JSON.stringify(json) + "' instead)")
        })
      },
      'should load invalid json (object with trailing comma)': function(topic) {
        topic(__dirname + '/data/invalidObjectTrailingComma.json', function(err, json) {
          assert(!err, "should not throw. (" + err.message + ")")
          assert.deepEqual(json, {
            "object": {
              "one": 1,
              "two": 2,
              "three": 3,
              "four": 4,
              "five": 5,
            }
          }, "should match object literal (got '" + JSON.stringify(json) + "' instead)")
        })
      }
    }
  },
}).export(module)
