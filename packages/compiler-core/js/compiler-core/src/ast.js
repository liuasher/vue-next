"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shared_1 = require("../../shared/js/index");
exports.locStub = {
    source: '',
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
};
function createArrayExpression(elements, loc) {
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 16,
        loc: loc,
        elements: elements
    };
}
exports.createArrayExpression = createArrayExpression;
function createObjectExpression(properties, loc) {
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 14,
        loc: loc,
        properties: properties
    };
}
exports.createObjectExpression = createObjectExpression;
function createObjectProperty(key, value) {
    return {
        type: 15,
        loc: exports.locStub,
        key: shared_1.isString(key) ? createSimpleExpression(key, true) : key,
        value: value
    };
}
exports.createObjectProperty = createObjectProperty;
function createSimpleExpression(content, isStatic, loc, isConstant) {
    if (loc === void 0) { loc = exports.locStub; }
    if (isConstant === void 0) { isConstant = false; }
    return {
        type: 4,
        loc: loc,
        isConstant: isConstant,
        content: content,
        isStatic: isStatic
    };
}
exports.createSimpleExpression = createSimpleExpression;
function createInterpolation(content, loc) {
    return {
        type: 5,
        loc: loc,
        content: shared_1.isString(content)
            ? createSimpleExpression(content, false, loc)
            : content
    };
}
exports.createInterpolation = createInterpolation;
function createCompoundExpression(children, loc) {
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 8,
        loc: loc,
        children: children
    };
}
exports.createCompoundExpression = createCompoundExpression;
function createCallExpression(callee, args, loc) {
    if (args === void 0) { args = []; }
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 13,
        loc: loc,
        callee: callee,
        arguments: args
    };
}
exports.createCallExpression = createCallExpression;
function createFunctionExpression(params, returns, newline, loc) {
    if (newline === void 0) { newline = false; }
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 17,
        params: params,
        returns: returns,
        newline: newline,
        loc: loc
    };
}
exports.createFunctionExpression = createFunctionExpression;
function createSequenceExpression(expressions) {
    return {
        type: 18,
        expressions: expressions,
        loc: exports.locStub
    };
}
exports.createSequenceExpression = createSequenceExpression;
function createConditionalExpression(test, consequent, alternate) {
    return {
        type: 19,
        test: test,
        consequent: consequent,
        alternate: alternate,
        loc: exports.locStub
    };
}
exports.createConditionalExpression = createConditionalExpression;
function createCacheExpression(index, value, isVNode) {
    if (isVNode === void 0) { isVNode = false; }
    return {
        type: 20,
        index: index,
        value: value,
        isVNode: isVNode,
        loc: exports.locStub
    };
}
exports.createCacheExpression = createCacheExpression;
