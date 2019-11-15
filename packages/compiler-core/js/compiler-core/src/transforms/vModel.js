"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var utils_1 = require("../utils");
exports.transformModel = function (dir, node, context) {
    var exp = dir.exp, arg = dir.arg;
    if (!exp) {
        context.onError(errors_1.createCompilerError(47, dir.loc));
        return createTransformProps();
    }
    var expString = exp.type === 4 ? exp.content : exp.loc.source;
    if (!utils_1.isMemberExpression(expString)) {
        context.onError(errors_1.createCompilerError(48, exp.loc));
        return createTransformProps();
    }
    if (!__BROWSER__ &&
        context.prefixIdentifiers &&
        utils_1.isSimpleIdentifier(expString) &&
        context.identifiers[expString]) {
        context.onError(errors_1.createCompilerError(49, exp.loc));
        return createTransformProps();
    }
    var propName = arg ? arg : ast_1.createSimpleExpression('modelValue', true);
    var eventName = arg
        ? arg.type === 4 && arg.isStatic
            ? ast_1.createSimpleExpression('onUpdate:' + arg.content, true)
            : ast_1.createCompoundExpression(__spreadArrays([
                ast_1.createSimpleExpression('onUpdate:', true),
                '+'
            ], (arg.type === 4 ? [arg] : arg.children)))
        : ast_1.createSimpleExpression('onUpdate:modelValue', true);
    var props = [
        ast_1.createObjectProperty(propName, dir.exp),
        ast_1.createObjectProperty(eventName, ast_1.createCompoundExpression(__spreadArrays([
            "$event => ("
        ], (exp.type === 4 ? [exp] : exp.children), [
            " = $event)"
        ])))
    ];
    if (!__BROWSER__ &&
        context.prefixIdentifiers &&
        context.cacheHandlers &&
        !utils_1.hasScopeRef(exp, context.identifiers)) {
        props[1].value = context.cache(props[1].value);
    }
    if (dir.modifiers.length && node.tagType === 1) {
        var modifiers = dir.modifiers
            .map(function (m) { return (utils_1.isSimpleIdentifier(m) ? m : JSON.stringify(m)) + ": true"; })
            .join(", ");
        props.push(ast_1.createObjectProperty("modelModifiers", ast_1.createSimpleExpression("{ " + modifiers + " }", false, dir.loc, true)));
    }
    return createTransformProps(props);
};
function createTransformProps(props) {
    if (props === void 0) { props = []; }
    return { props: props, needRuntime: false };
}
