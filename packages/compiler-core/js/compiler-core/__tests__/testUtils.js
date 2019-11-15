"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../src");
var runtimeHelpers_1 = require("../src/runtimeHelpers");
var shared_1 = require("@vue/shared");
var leadingBracketRE = /^\[/;
var bracketsRE = /^\[|\]$/g;
function createObjectMatcher(obj) {
    return {
        type: 14,
        properties: Object.keys(obj).map(function (key) { return ({
            type: 15,
            key: {
                type: 4,
                content: key.replace(bracketsRE, ''),
                isStatic: !leadingBracketRE.test(key)
            },
            value: shared_1.isString(obj[key])
                ? {
                    type: 4,
                    content: obj[key].replace(bracketsRE, ''),
                    isStatic: !leadingBracketRE.test(obj[key])
                }
                : obj[key]
        }); })
    };
}
exports.createObjectMatcher = createObjectMatcher;
function createElementWithCodegen(args) {
    return {
        type: 1,
        loc: src_1.locStub,
        ns: 0,
        tag: 'div',
        tagType: 0,
        isSelfClosing: false,
        props: [],
        children: [],
        codegenNode: {
            type: 13,
            loc: src_1.locStub,
            callee: runtimeHelpers_1.CREATE_VNODE,
            arguments: args
        }
    };
}
exports.createElementWithCodegen = createElementWithCodegen;
function genFlagText(flag) {
    if (shared_1.isArray(flag)) {
        var f_1 = 0;
        flag.forEach(function (ff) {
            f_1 |= ff;
        });
        return f_1 + " /* " + flag.map(function (f) { return shared_1.PatchFlagNames[f]; }).join(', ') + " */";
    }
    else {
        return flag + " /* " + shared_1.PatchFlagNames[flag] + " */";
    }
}
exports.genFlagText = genFlagText;
