"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var parse_1 = require("./parse");
var transform_1 = require("./transform");
var codegen_1 = require("./codegen");
var shared_1 = require("../../shared/js/index");
var vIf_1 = require("./transforms/vIf");
var vFor_1 = require("./transforms/vFor");
var transformExpression_1 = require("./transforms/transformExpression");
var transformSlotOutlet_1 = require("./transforms/transformSlotOutlet");
var transformElement_1 = require("./transforms/transformElement");
var vOn_1 = require("./transforms/vOn");
var vBind_1 = require("./transforms/vBind");
var errors_1 = require("./errors");
var vSlot_1 = require("./transforms/vSlot");
var transformText_1 = require("./transforms/transformText");
var vOnce_1 = require("./transforms/vOnce");
var vModel_1 = require("./transforms/vModel");
function baseCompile(template, options) {
    if (options === void 0) { options = {}; }
    if (__BROWSER__) {
        var onError = options.onError || errors_1.defaultOnError;
        if (options.prefixIdentifiers === true) {
            onError(errors_1.createCompilerError(51));
        }
        else if (options.mode === 'module') {
            onError(errors_1.createCompilerError(52));
        }
    }
    var ast = shared_1.isString(template) ? parse_1.parse(template, options) : template;
    var prefixIdentifiers = !__BROWSER__ &&
        (options.prefixIdentifiers === true || options.mode === 'module');
    transform_1.transform(ast, __assign(__assign({}, options), { prefixIdentifiers: prefixIdentifiers, nodeTransforms: __spreadArrays([
            vOnce_1.transformOnce,
            vIf_1.transformIf,
            vFor_1.transformFor
        ], (prefixIdentifiers
            ? [
                vSlot_1.trackVForSlotScopes,
                transformExpression_1.transformExpression
            ]
            : []), [
            transformSlotOutlet_1.transformSlotOutlet,
            transformElement_1.transformElement,
            vSlot_1.trackSlotScopes,
            transformText_1.transformText
        ], (options.nodeTransforms || [])), directiveTransforms: __assign({ on: vOn_1.transformOn, bind: vBind_1.transformBind, model: vModel_1.transformModel }, (options.directiveTransforms || {})) }));
    return codegen_1.generate(ast, __assign(__assign({}, options), { prefixIdentifiers: prefixIdentifiers }));
}
exports.baseCompile = baseCompile;
var parse_2 = require("./parse");
exports.parse = parse_2.parse;
var transform_2 = require("./transform");
exports.transform = transform_2.transform;
exports.createStructuralDirectiveTransform = transform_2.createStructuralDirectiveTransform;
var codegen_2 = require("./codegen");
exports.generate = codegen_2.generate;
var errors_2 = require("./errors");
exports.createCompilerError = errors_2.createCompilerError;
__export(require("./ast"));
__export(require("./utils"));
__export(require("./codeframe"));
var runtimeHelpers_1 = require("./runtimeHelpers");
exports.registerRuntimeHelpers = runtimeHelpers_1.registerRuntimeHelpers;
var vModel_2 = require("./transforms/vModel");
exports.transformModel = vModel_2.transformModel;
var vOn_2 = require("./transforms/vOn");
exports.transformOn = vOn_2.transformOn;
