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
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../src");
var transformElement_1 = require("../../src/transforms/transformElement");
var vOn_1 = require("../../src/transforms/vOn");
var vBind_1 = require("../../src/transforms/vBind");
var transformExpression_1 = require("../../src/transforms/transformExpression");
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var transformSlotOutlet_1 = require("../../src/transforms/transformSlotOutlet");
function parseWithSlots(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ nodeTransforms: __spreadArrays((options.prefixIdentifiers ? [transformExpression_1.transformExpression] : []), [
            transformSlotOutlet_1.transformSlotOutlet,
            transformElement_1.transformElement
        ]), directiveTransforms: {
            on: vOn_1.transformOn,
            bind: vBind_1.transformBind
        } }, options));
    return ast;
}
describe('compiler: transform <slot> outlets', function () {
    test('default slot outlet', function () {
        var ast = parseWithSlots("<slot/>");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: ["$slots", "\"default\""]
        });
    });
    test('statically named slot outlet', function () {
        var ast = parseWithSlots("<slot name=\"foo\" />");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: ["$slots", "\"foo\""]
        });
    });
    test('dynamically named slot outlet', function () {
        var ast = parseWithSlots("<slot :name=\"foo\" />");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                {
                    type: 4,
                    content: "foo",
                    isStatic: false
                }
            ]
        });
    });
    test('dynamically named slot outlet w/ prefixIdentifiers: true', function () {
        var ast = parseWithSlots("<slot :name=\"foo + bar\" />", {
            prefixIdentifiers: true
        });
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "_ctx.$slots",
                {
                    type: 8,
                    children: [
                        {
                            type: 4,
                            content: "_ctx.foo",
                            isStatic: false
                        },
                        " + ",
                        {
                            type: 4,
                            content: "_ctx.bar",
                            isStatic: false
                        }
                    ]
                }
            ]
        });
    });
    test('default slot outlet with props', function () {
        var ast = parseWithSlots("<slot foo=\"bar\" :baz=\"qux\" />");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                "\"default\"",
                {
                    type: 14,
                    properties: [
                        {
                            key: {
                                content: "foo",
                                isStatic: true
                            },
                            value: {
                                content: "bar",
                                isStatic: true
                            }
                        },
                        {
                            key: {
                                content: "baz",
                                isStatic: true
                            },
                            value: {
                                content: "qux",
                                isStatic: false
                            }
                        }
                    ]
                }
            ]
        });
    });
    test('statically named slot outlet with props', function () {
        var ast = parseWithSlots("<slot name=\"foo\" foo=\"bar\" :baz=\"qux\" />");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                "\"foo\"",
                {
                    type: 14,
                    properties: [
                        {
                            key: {
                                content: "foo",
                                isStatic: true
                            },
                            value: {
                                content: "bar",
                                isStatic: true
                            }
                        },
                        {
                            key: {
                                content: "baz",
                                isStatic: true
                            },
                            value: {
                                content: "qux",
                                isStatic: false
                            }
                        }
                    ]
                }
            ]
        });
    });
    test('dynamically named slot outlet with props', function () {
        var ast = parseWithSlots("<slot :name=\"foo\" foo=\"bar\" :baz=\"qux\" />");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                { content: "foo", isStatic: false },
                {
                    type: 14,
                    properties: [
                        {
                            key: {
                                content: "foo",
                                isStatic: true
                            },
                            value: {
                                content: "bar",
                                isStatic: true
                            }
                        },
                        {
                            key: {
                                content: "baz",
                                isStatic: true
                            },
                            value: {
                                content: "qux",
                                isStatic: false
                            }
                        }
                    ]
                }
            ]
        });
    });
    test('default slot outlet with fallback', function () {
        var ast = parseWithSlots("<slot><div/></slot>");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                "\"default\"",
                "{}",
                [
                    {
                        type: 1,
                        tag: "div"
                    }
                ]
            ]
        });
    });
    test('named slot outlet with fallback', function () {
        var ast = parseWithSlots("<slot name=\"foo\"><div/></slot>");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                "\"foo\"",
                "{}",
                [
                    {
                        type: 1,
                        tag: "div"
                    }
                ]
            ]
        });
    });
    test('default slot outlet with props & fallback', function () {
        var ast = parseWithSlots("<slot :foo=\"bar\"><div/></slot>");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                "\"default\"",
                {
                    type: 14,
                    properties: [
                        {
                            key: {
                                content: "foo",
                                isStatic: true
                            },
                            value: {
                                content: "bar",
                                isStatic: false
                            }
                        }
                    ]
                },
                [
                    {
                        type: 1,
                        tag: "div"
                    }
                ]
            ]
        });
    });
    test('named slot outlet with props & fallback', function () {
        var ast = parseWithSlots("<slot name=\"foo\" :foo=\"bar\"><div/></slot>");
        expect(ast.children[0].codegenNode).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.RENDER_SLOT,
            arguments: [
                "$slots",
                "\"foo\"",
                {
                    type: 14,
                    properties: [
                        {
                            key: {
                                content: "foo",
                                isStatic: true
                            },
                            value: {
                                content: "bar",
                                isStatic: false
                            }
                        }
                    ]
                },
                [
                    {
                        type: 1,
                        tag: "div"
                    }
                ]
            ]
        });
    });
    test("error on unexpected custom directive on <slot>", function () {
        var onError = jest.fn();
        var source = "<slot v-foo />";
        parseWithSlots(source, { onError: onError });
        var index = source.indexOf('v-foo');
        expect(onError.mock.calls[0][0]).toMatchObject({
            code: 41,
            loc: {
                source: "v-foo",
                start: {
                    offset: index,
                    line: 1,
                    column: index + 1
                },
                end: {
                    offset: index + 5,
                    line: 1,
                    column: index + 6
                }
            }
        });
    });
});
