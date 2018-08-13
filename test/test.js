var assert = require('assert')
var jbpExtract = require('../index.js')

describe('extract', function () {
    describe('basics', function () {
        it('should select one item with a string selector', function () {
            var expected = { "foo": 3 }
            var actual = jbpExtract(["foo"], { "foo": 3, "bar": 4 })
            assert.deepEqual(actual, expected)
        })

        it('should select one item with a number selector', function () {
            var expected = { 0: 3 }
            var actual = jbpExtract([0], [3])
            assert.deepEqual(actual, expected)
        })
    })

    describe('sub-selectors', function () {
        it('should extract deep into an object', function () {
            var expected = { "foo": { "bar": 3 } }
            var actual = jbpExtract([{ "foo": ["bar"] }], {
                "foo": {
                    "bar": 3,
                    "baz": 12
                },
                "quux": "hello"
            })

            assert.deepEqual(actual, expected)
        })
    })

    describe('array indexes', function () {
        it('should select the last item of an array', function () {
            var expected = { "-": "bye" }
            var actual = jbpExtract(["-"], ["hi", "bye"])
            assert.deepEqual(actual, expected)
        })

        it('should select starting from the end of an array', function () {
            var expected = { "-2": "bar" }
            var actual = jbpExtract([-2], ["foo", "bar", "baz"])
            assert.deepEqual(actual, expected)
        })
    })

    describe('each-item array selectors', function () {
        it('should select each item in an array with the given pointer', function () {
            var expected = [{ "foo": 3, "bar": 4 }, { "foo": 5, "bar": 6 }]
            var actual = jbpExtract([["foo", "bar"]], [
                { "foo": 3, "bar": 4, "baz": "hello" },
                { "foo": 5, "bar": 6, "baz": "goodbye" }
            ])
            
            assert.deepEqual(actual, expected)
        })
    })

    describe('non-existent key', function () {
        it('should return an empty object for an unfound root key', function () {
            var expected = {}
            var actual = jbpExtract(["foo"], { "bar": 3 })
            assert.deepEqual(actual, expected)
        })

        it('should return an empty map for an empty map', function () {
            var expected = {}
            var actual = jbpExtract(["foo"], {})
            assert.deepEqual(actual, expected)
        })

        it('should extract as far down into the object as possible', function () {
            var expected = { "foo": {} }
            var actual = jbpExtract([{ "foo": ["bar"] }], { "foo": 3 })
            assert.deepEqual(actual, expected)
        })

        it('should not try to continue extracting from an unfound key', function () {
            var expected = {}
            var actual = jbpExtract([{ "foo": ["bar"] }], { "baz": 3 })
            assert.deepEqual(actual, expected)
        })
    })

    describe('array length', function () {
        it('should fetch the length of an array', function () {
            var expected = { "length": 3 }
            var actual = jbpExtract(["length"], [1, 2, 3])
            assert.deepEqual(actual, expected)
        })

        it('should return 0 for an empty array', function () {
            var expected = { "length": 0 }
            var actual = jbpExtract(["length"], [])
            assert.deepEqual(actual, expected)
        })

        it('should return an empty object when target is not an array', function () {
            var expected = {}
            var actual = jbpExtract(["length"], { "foo": "bar" })
            assert.deepEqual(actual, expected)
        })

        it('should return a "length" key in an object', function () {
            var expected = { "length": "3km" }
            var actual = jbpExtract(["length"], { "length": "3km" })
            assert.deepEqual(actual, expected)
        })
    })

    describe('error cases', function () {
        it('should throw if the pointer is not an array', function () {
            assert.throws(function () {
                return jbpExtract('foo', { "foo": "bar" })
            }, "Invalid selector")
        })

        it('should wrap a nested error in a sub-selector error', function () {
            assert.throws(function () {
                return jbpExtract([{"foo": "bar"}], { "foo": "bar" })
            }, "Sub-selector error")
        })

        it('should throw with mixed each-item and regular selectors', function () {
            assert.throws(function () {
                return jbpExtract([["foo"], 3], {})
            }, "An each-item array selector can't be mixed with other selectors.")
        })
    })
})