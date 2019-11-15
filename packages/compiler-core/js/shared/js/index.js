"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var makeMap_1 = require("./makeMap");
exports.makeMap = makeMap_1.makeMap;
__export(require("./patchFlags"));
var globalsWhitelist_1 = require("./globalsWhitelist");
exports.isGloballyWhitelisted = globalsWhitelist_1.isGloballyWhitelisted;
exports.EMPTY_OBJ = Object.freeze({})
exports.EMPTY_ARR = [];
exports.NOOP = function () { };
exports.NO = function () { return false; };
exports.isOn = function (key) { return key[0] === 'o' && key[1] === 'n'; };
exports.extend = function (a, b) {
    for (var key in b) {
        ;
        a[key] = b[key];
    }
    return a;
};
var hasOwnProperty = Object.prototype.hasOwnProperty;
exports.hasOwn = function (val, key) { return hasOwnProperty.call(val, key); };
exports.isArray = Array.isArray;
exports.isFunction = function (val) {
    return typeof val === 'function';
};
exports.isString = function (val) { return typeof val === 'string'; };
exports.isSymbol = function (val) { return typeof val === 'symbol'; };
exports.isObject = function (val) {
    return val !== null && typeof val === 'object';
};
function isPromise(val) {
    return exports.isObject(val) && exports.isFunction(val.then) && exports.isFunction(val.catch);
}
exports.isPromise = isPromise;
exports.objectToString = Object.prototype.toString;
exports.toTypeString = function (value) {
    return exports.objectToString.call(value);
};
function toRawType(value) {
    return exports.toTypeString(value).slice(8, -1);
}
exports.toRawType = toRawType;
exports.isPlainObject = function (val) {
    return exports.toTypeString(val) === '[object Object]';
};
exports.isReservedProp = makeMap_1.makeMap('key,ref,' +
    'onVnodeBeforeMount,onVnodeMounted,' +
    'onVnodeBeforeUpdate,onVnodeUpdated,' +
    'onVnodeBeforeUnmount,onVnodeUnmounted');
var camelizeRE = /-(\w)/g;
exports.camelize = function (str) {
    return str.replace(camelizeRE, function (_, c) { return (c ? c.toUpperCase() : ''); });
};
var hyphenateRE = /\B([A-Z])/g;
exports.hyphenate = function (str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase();
};
exports.capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.hasChanged = function (value, oldValue) {
    return value !== oldValue && (value === value || oldValue === oldValue);
};
