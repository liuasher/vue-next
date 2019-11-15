"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var makeMap_1 = require("./makeMap");
var GLOBALS_WHITE_LISTED = 'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
    'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
    'Object,Boolean,String,RegExp,Map,Set,JSON,Intl';
exports.isGloballyWhitelisted = makeMap_1.makeMap(GLOBALS_WHITE_LISTED);
