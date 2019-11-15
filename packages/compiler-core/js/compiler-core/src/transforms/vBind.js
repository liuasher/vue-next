"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var shared_1 = require("@vue/shared");
var runtimeHelpers_1 = require("../runtimeHelpers");
exports.transformBind = function (dir, node, context) {
    var exp = dir.exp, modifiers = dir.modifiers, loc = dir.loc;
    var arg = dir.arg;
    if (!exp) {
        context.onError(errors_1.createCompilerError(39, loc));
    }
    if (modifiers.includes('camel')) {
        if (arg.type === 4) {
            if (arg.isStatic) {
                arg.content = shared_1.camelize(arg.content);
            }
            else {
                arg.content = context.helperString(runtimeHelpers_1.CAMELIZE) + "(" + arg.content + ")";
            }
        }
        else {
            arg.children.unshift(context.helperString(runtimeHelpers_1.CAMELIZE) + "(");
            arg.children.push(")");
        }
    }
    return {
        props: [
            ast_1.createObjectProperty(arg, exp || ast_1.createSimpleExpression('', true, loc))
        ],
        needRuntime: false
    };
};
