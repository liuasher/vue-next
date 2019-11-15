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
var shared_1 = require("@vue/shared");
var errors_1 = require("../errors");
var transformExpression_1 = require("./transformExpression");
var utils_1 = require("../utils");
var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;
exports.transformOn = function (dir, node, context, augmentor) {
    var loc = dir.loc, modifiers = dir.modifiers, arg = dir.arg;
    if (!dir.exp && !modifiers.length) {
        context.onError(errors_1.createCompilerError(40, loc));
    }
    var eventName;
    if (arg.type === 4) {
        if (arg.isStatic) {
            eventName = ast_1.createSimpleExpression("on" + shared_1.capitalize(arg.content), true, arg.loc);
        }
        else {
            eventName = ast_1.createCompoundExpression(["\"on\" + (", arg, ")"]);
        }
    }
    else {
        eventName = arg;
        eventName.children.unshift("\"on\" + (");
        eventName.children.push(")");
    }
    var exp = dir.exp;
    var isCacheable = !exp;
    if (exp) {
        var isMemberExp = utils_1.isMemberExpression(exp.content);
        var isInlineStatement = !(isMemberExp || fnExpRE.test(exp.content));
        if (!__BROWSER__ && context.prefixIdentifiers) {
            context.addIdentifiers("$event");
            exp = transformExpression_1.processExpression(exp, context);
            context.removeIdentifiers("$event");
            isCacheable =
                context.cacheHandlers && !utils_1.hasScopeRef(exp, context.identifiers);
            if (isCacheable && isMemberExp) {
                if (exp.type === 4) {
                    exp.content += "($event)";
                }
                else {
                    exp.children.push("($event)");
                }
            }
        }
        if (isInlineStatement || (isCacheable && isMemberExp)) {
            exp = ast_1.createCompoundExpression(__spreadArrays([
                "$event => ("
            ], (exp.type === 4 ? [exp] : exp.children), [
                ")"
            ]));
        }
    }
    var ret = {
        props: [
            ast_1.createObjectProperty(eventName, exp || ast_1.createSimpleExpression("() => {}", false, loc))
        ],
        needRuntime: false
    };
    if (augmentor) {
        ret = augmentor(ret);
    }
    if (isCacheable) {
        ret.props[0].value = context.cache(ret.props[0].value);
    }
    return ret;
};
