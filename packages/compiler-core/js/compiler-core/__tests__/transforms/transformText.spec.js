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
var transformText_1 = require("../../src/transforms/transformText");
var transformExpression_1 = require("../../src/transforms/transformExpression");
var transformElement_1 = require("../../src/transforms/transformElement");
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var testUtils_1 = require("../testUtils");
var shared_1 = require("@vue/shared");
function transformWithTextOpt(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ nodeTransforms: __spreadArrays((options.prefixIdentifiers ? [transformExpression_1.transformExpression] : []), [
            transformText_1.transformText,
            transformElement_1.transformElement
        ]) }, options));
    return ast;
}
describe('compiler: transform text', function () {
    test('no consecutive text', function () {
        var root = transformWithTextOpt("{{ foo }}");
        expect(root.children[0]).toMatchObject({
            type: 5,
            content: {
                content: "foo"
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('consecutive text', function () {
        var root = transformWithTextOpt("{{ foo }} bar {{ baz }}");
        expect(root.children.length).toBe(1);
        expect(root.children[0]).toMatchObject({
            type: 8,
            children: [
                { type: 5, content: { content: "foo" } },
                " + ",
                { type: 2, content: " bar " },
                " + ",
                { type: 5, content: { content: "baz" } }
            ]
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('consecutive text between elements', function () {
        var root = transformWithTextOpt("<div/>{{ foo }} bar {{ baz }}<div/>");
        expect(root.children.length).toBe(3);
        expect(root.children[0].type).toBe(1);
        expect(root.children[1]).toMatchObject({
            type: 12,
            codegenNode: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_TEXT,
                arguments: [
                    {
                        type: 8,
                        children: [
                            { type: 5, content: { content: "foo" } },
                            " + ",
                            { type: 2, content: " bar " },
                            " + ",
                            { type: 5, content: { content: "baz" } }
                        ]
                    },
                    testUtils_1.genFlagText(shared_1.PatchFlags.TEXT)
                ]
            }
        });
        expect(root.children[2].type).toBe(1);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('text between elements (static)', function () {
        var root = transformWithTextOpt("<div/>hello<div/>");
        expect(root.children.length).toBe(3);
        expect(root.children[0].type).toBe(1);
        expect(root.children[1]).toMatchObject({
            type: 12,
            codegenNode: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_TEXT,
                arguments: [
                    {
                        type: 2,
                        content: "hello"
                    }
                ]
            }
        });
        expect(root.children[2].type).toBe(1);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('consecutive text mixed with elements', function () {
        var root = transformWithTextOpt("<div/>{{ foo }} bar {{ baz }}<div/>hello<div/>");
        expect(root.children.length).toBe(5);
        expect(root.children[0].type).toBe(1);
        expect(root.children[1]).toMatchObject({
            type: 12,
            codegenNode: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_TEXT,
                arguments: [
                    {
                        type: 8,
                        children: [
                            { type: 5, content: { content: "foo" } },
                            " + ",
                            { type: 2, content: " bar " },
                            " + ",
                            { type: 5, content: { content: "baz" } }
                        ]
                    },
                    testUtils_1.genFlagText(shared_1.PatchFlags.TEXT)
                ]
            }
        });
        expect(root.children[2].type).toBe(1);
        expect(root.children[3]).toMatchObject({
            type: 12,
            codegenNode: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_TEXT,
                arguments: [
                    {
                        type: 2,
                        content: "hello"
                    }
                ]
            }
        });
        expect(root.children[4].type).toBe(1);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('with prefixIdentifiers: true', function () {
        var root = transformWithTextOpt("{{ foo }} bar {{ baz + qux }}", {
            prefixIdentifiers: true
        });
        expect(root.children.length).toBe(1);
        expect(root.children[0]).toMatchObject({
            type: 8,
            children: [
                { type: 5, content: { content: "_ctx.foo" } },
                " + ",
                { type: 2, content: " bar " },
                " + ",
                {
                    type: 5,
                    content: {
                        type: 8,
                        children: [{ content: "_ctx.baz" }, " + ", { content: "_ctx.qux" }]
                    }
                }
            ]
        });
        expect(src_1.generate(root, {
            prefixIdentifiers: true
        }).code).toMatchSnapshot();
    });
});
