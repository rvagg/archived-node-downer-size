const path      = require('path')
    , fs        = require('fs')
    , rimraf    = require('rimraf')
    , test      = require('tap').test
    , leveldown = require('leveldown')

require('./').use()

var dbidx = 0

  , dbiface

    // new database location for each test
  , location = function () {
      return path.join(__dirname, '_rangedel_test_db_' + dbidx++)
    }

    // proper cleanup of any database directories
  , cleanup = function (callback) {
      fs.readdir(__dirname, function (err, list) {
        if (err) return callback(err)

        list = list.filter(function (f) {
          return (/^_rangedel_test_db_/).test(f)
        })

        if (!list.length)
          return callback()

        var ret = 0

        list.forEach(function (f) {
          rimraf(f, function () {
            if (++ret == list.length)
              callback()
          })
        })
      })
    }

    // some source data to play with, keys from 00 to 99 with random data
  , sourceData = (function () {
      var d = []
        , i = 0
        , k
      for (; i < 100; i++) {
        k = (i < 10 ? '0' : '') + i
        d.push({
            type  : 'put'
          , key   : k
          , value : Math.random()
        })
      }
      return d
    }())

    // this simply wraps around each test function to set up a new database
    // with the sourceData, run the test, close the database and cleanup
  , openclosewrap = function (fn) {
      return function (t) {
        var db
          , end = t.end
        // replace t.end() with our own so we can cleanup then call the real
        // t.end() to finish the test
        t.end = function () {
          db.close(function (err) {
            t.notOk(err, 'close() did not return an error')
            cleanup(end.bind(t))
          })
        }

        cleanup(function (err) {
          t.notOk(err, 'cleanup did not return an error')
          db = dbiface(location())
          db.open(function (err) {
            t.notOk(err, 'open did not return an error')
            db.batch(sourceData, function (err) {
              t.notOk(err, 'open did not return an error')
              fn(db, t)
            })
          })
        })
      }
    }

module.exports = function (_dbiface) {
  dbiface = _dbiface

  // note that each test function is wrapped in openclosewrap()

  test('test argument-less db#size() exists', openclosewrap(function (db, t) {
    t.ok(db.size, 'db.size exists')
    t.type(db.size, 'function', 'db.size() is a function')
    t.end()
  }))

  test('test argument-less db#size() throws', openclosewrap(function (db, t) {
    t.throws(db.size.bind(db), 'no-arg size() throws')
    t.end()
  }))

  test('test full size', openclosewrap(function (db, t) {
    db.size(function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, sourceData.length, 'correct size')
      t.end()
    })
  }))

  test('test full size with start=0', openclosewrap(function (db, t) {
    db.size({ start: '00' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, sourceData.length, 'correct size')
      t.end()
    })
  }))

  test('test size with start=50', openclosewrap(function (db, t) {
    db.size({ start: '50' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, 50, 'correct size')
      t.end()
    })
  }))

  test('test size with start being a midway key (49.5)', openclosewrap(function (db, t) {
    db.size({ start: '49.5' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, 50, 'correct size')
      t.end()
    })
  }))

  test('test size with start being a midway key (499999)', openclosewrap(function (db, t) {
    db.size({ start: '499999' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, 50, 'correct size')
      t.end()
    })
  }))

  test('test size with end=50', openclosewrap(function (db, t) {
    db.size({ end: '50' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, 51, 'correct size')
      t.end()
    })
  }))

  test('test size with being a midway key (50.5)', openclosewrap(function (db, t) {
    db.size({ end: '50.5' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, 51, 'correct size')
      t.end()
    })
  }))

  test('test size with being a midway key (50555)', openclosewrap(function (db, t) {
    db.size({ end: '50555' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, 51, 'correct size')
      t.end()
    })
  }))

  // end='0', starting key is actually '00' so it should avoid it
  test('test size with end=0 (not "00")', openclosewrap(function (db, t) {
    db.size({ end: 0 }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, sourceData.length, 'correct size')
      t.end()
    })
  }))

  test('test size with start=30 and end=70', openclosewrap(function (db, t) {
    db.size({ start: '30', end: '70' }, function (err, size) {
      t.notOk(err, 'size did not return an error')
      t.equal(size, 41, 'correct size')
      t.end()
    })
  }))
}

if (require.main === module)
  module.exports(leveldown)
