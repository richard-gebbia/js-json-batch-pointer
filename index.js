(function () {
    var _ = {
        isArray: require('lodash/isArray'),
        isNil: require('lodash/isNil'),
        isNumber: require('lodash/isNumber'),
        isObject: require('lodash/isObject'),
        isString: require('lodash/isString'),
        map: require('lodash/map'),
        parseInt: require('lodash/parseInt'),
        some: require('lodash/some')
    }

    var assert = function (cond, msg, ctx) {
        if (!cond) {
            throw {
                msg: msg,
                ctx: ctx
            }
        }
    }

    var extractIndex = function (index, json) {
        if (index < 0) {
            return json[json.length + index]
        }

        return json[index]
    }

    var extractField = function (field, json) {
        var val;

        if (_.isArray(json)) {
            // special case, getting the length of an array
            if (field == "length") {
                return json.length
            }

            // speical case, getting the last item in an array
            if (field == "-") {
                return json[json.length - 1]
            }
        }

        if (_.isString(field) || _.isNumber(field)) {
            val = json[field]
            if (val) {
                return val
            }

            return extractIndex(_.parseInt(field), json)
        }

        throw {
            msg: "Invalid selector",
            ctx: { selector: field }
        }
    }

    function extract(ptr, json) {
        var isArray = _.isArray(ptr)
        var ptrLength = ptr.length

        assert(isArray, "Invalid selector", { ctx: ptr })

        // special case for each-item array selectors
        if (isArray && _.isArray(ptr[0])) {
            var arraySelector = ptr[0]

            assert(ptrLength === 1,
                "An each-item array selector can't be mixed with other selectors.", {
                    ptr: ptr
                })
            
            return _.map(json, function (arrayItem) { 
                return extract(arraySelector, arrayItem) 
            })
        }

        // if it's not an each-item array selector, begin the normal extraction process
        var extraction = {}

        for (var i = 0; i < ptrLength; ++i) {
            var key = null
            var subExtraction = null
            var ptrElem = ptr[i]

            // if the item is an object, its fields point to fields
            // in the corresponding json
            if (_.isObject(ptr[i])) {
                for (var prop in ptrElem) {
                    var jsonVal = json[prop]
                    if (jsonVal) {
                        var subPtr = ptrElem[prop]

                        key = prop
                        try {
                            subExtraction = extract(subPtr, jsonVal)
                        }
                        catch (e) {
                            throw {
                                msg: "Sub-selector error",
                                ctx: {
                                    ptr: ptr,
                                    error: e
                                }
                            }
                        }
                    }
                }
            }
            else {
                key = ptrElem
                try {
                    subExtraction = extractField(ptrElem, json)
                }
                catch (e) {
                    throw {
                        msg: "Sub-selector error",
                        ctx: {
                            ptr: ptr,
                            error: e
                        }
                    }
                }
            }

            if (!_.isNil(subExtraction)) {
                extraction[key] = subExtraction
            }
        }

        return extraction
    }

    if (module) {
        module.exports = extract
    }
})()