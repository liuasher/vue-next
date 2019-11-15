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
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../src");
var vOn_1 = require("../../src/transforms/vOn");
var transformElement_1 = require("../../src/transforms/transformElement");
var transformExpression_1 = require("../../src/transforms/transformExpression");
function parseWithVOn(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ nodeTransforms: [transformExpression_1.transformExpression, transformElement_1.transformElement], directiveTransforms: {
            on: vOn_1.transformOn
        } }, options));
    return {
        root: ast,
        node: ast.children[0]
    };
}
describe('compiler: transform v-on', function () {
    test('basic', function () {
        var node = parseWithVOn("<div v-on:click=\"onClick\"/>").node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                content: "onClick",
                isStatic: true,
                loc: {
                    start: {
                        line: 1,
                        column: 11
                    },
                    end: {
                        line: 1,
                        column: 16
                    }
                }
            },
            value: {
                content: "onClick",
                isStatic: false,
                loc: {
                    start: {
                        line: 1,
                        column: 18
                    },
                    end: {
                        line: 1,
                        column: 25
                    }
                }
            }
        });
    });
    test('dynamic arg', function () {
        var node = parseWithVOn("<div v-on:[event]=\"handler\"/>").node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                type: 8,
                children: ["\"on\" + (", { content: "event" }, ")"]
            },
            value: {
                type: 4,
                content: "handler",
                isStatic: false
            }
        });
    });
    test('dynamic arg with prefixing', function () {
        var node = parseWithVOn("<div v-on:[event]=\"handler\"/>", {
            prefixIdentifiers: true
        }).node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                type: 8,
                children: ["\"on\" + (", { content: "_ctx.event" }, ")"]
            },
            value: {
                type: 4,
                content: "_ctx.handler",
                isStatic: false
            }
        });
    });
    test('dynamic arg with complex exp prefixing', function () {
        var node = parseWithVOn("<div v-on:[event(foo)]=\"handler\"/>", {
            prefixIdentifiers: true
        }).node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                type: 8,
                children: [
                    "\"on\" + (",
                    { content: "_ctx.event" },
                    "(",
                    { content: "_ctx.foo" },
                    ")",
                    ")"
                ]
            },
            value: {
                type: 4,
                content: "_ctx.handler",
                isStatic: false
            }
        });
    });
    test('should wrap as function if expression is inline statement', function () {
        var node = parseWithVOn("<div @click=\"i++\"/>").node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: { content: "onClick" },
            value: {
                type: 8,
                children: ["$event => (", { content: "i++" }, ")"]
            }
        });
    });
    test('inline statement w/ prefixIdentifiers: true', function () {
        var node = parseWithVOn("<div @click=\"foo($event)\"/>", {
            prefixIdentifiers: true
        }).node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: { content: "onClick" },
            value: {
                type: 8,
                children: [
                    "$event => (",
                    { content: "_ctx.foo" },
                    "(",
                    { content: "$event" },
                    ")",
                    ")"
                ]
            }
        });
    });
    test('should NOT wrap as function if expression is already function expression', function () {
        var node = parseWithVOn("<div @click=\"$event => foo($event)\"/>").node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: { content: "onClick" },
            value: {
                type: 4,
                content: "$event => foo($event)"
            }
        });
    });
    test('should NOT wrap as function if expression is complex member expression', function () {
        var node = parseWithVOn("<div @click=\"a['b' + c]\"/>").node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: { content: "onClick" },
            value: {
                type: 4,
                content: "a['b' + c]"
            }
        });
    });
    test('complex member expression w/ prefixIdentifiers: true', function () {
        var node = parseWithVOn("<div @click=\"a['b' + c]\"/>", {
            prefixIdentifiers: true
        }).node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: { content: "onClick" },
            value: {
                type: 8,
                children: [{ content: "_ctx.a" }, "['b' + ", { content: "_ctx.c" }, "]"]
            }
        });
    });
    test('function expression w/ prefixIdentifiers: true', function () {
        var node = parseWithVOn("<div @click=\"e => foo(e)\"/>", {
            prefixIdentifiers: true
        }).node;
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: { content: "onClick" },
            value: {
                type: 8,
                children: [
                    { content: "e" },
                    " => ",
                    { content: "_ctx.foo" },
                    "(",
                    { content: "e" },
                    ")"
                ]
            }
        });
    });
    test('should error if no expression AND no modifier', function () {
        var onError = jest.fn();
        parseWithVOn("<div v-on:click />", { onError: onError });
        expect(onError.mock.calls[0][0]).toMatchObject({
            code: 40,
            loc: {
                start: {
                    line: 1,
                    column: 6
                },
                end: {
                    line: 1,
                    column: 16
                }
            }
        });
    });
    test('should NOT error if no expression but has modifier', function () {
        var onError = jest.fn();
        parseWithVOn("<div v-on:click.prevent />", { onError: onError });
        expect(onError).not.toHaveBeenCalled();
    });
    describe('cacheHandler', function () {
        test('empty handler', function () {
            var _a = parseWithVOn("<div v-on:click.prevent />", {
                prefixIdentifiers: true,
                cacheHandlers: true
            }), root = _a.root, node = _a.node;
            expect(root.cached).toBe(1);
            var args = node.codegenNode.arguments;
            expect(args.length).toBe(2);
            expect(args[1].properties[0].value).toMatchObject({
                type: 20,
                index: 1,
                value: {
                    type: 4,
                    content: "() => {}"
                }
            });
        });
        test('member expression handler', function () {
            var _a = parseWithVOn("<div v-on:click=\"foo\" />", {
                prefixIdentifiers: true,
                cacheHandlers: true
            }), root = _a.root, node = _a.node;
            expect(root.cached).toBe(1);
            var args = node.codegenNode.arguments;
            expect(args.length).toBe(2);
            expect(args[1].properties[0].value).toMatchObject({
                type: 20,
                index: 1,
                value: {
                    type: 8,
                    children: ["$event => (", { content: "_ctx.foo($event)" }, ")"]
                }
            });
        });
        test('inline function expression handler', function () {
            var _a = parseWithVOn("<div v-on:click=\"() => foo()\" />", {
                prefixIdentifiers: true,
                cacheHandlers: true
            }), root = _a.root, node = _a.node;
            expect(root.cached).toBe(1);
            var args = node.codegenNode.arguments;
            expect(args.length).toBe(2);
            expect(args[1].properties[0].value).toMatchObject({
                type: 20,
                index: 1,
                value: {
                    type: 8,
                    children: ["() => ", { content: "_ctx.foo" }, "()"]
                }
            });
        });
        test('inline statement handler', function () {
            var _a = parseWithVOn("<div v-on:click=\"foo++\" />", {
                prefixIdentifiers: true,
                cacheHandlers: true
            }), root = _a.root, node = _a.node;
            expect(root.cached).toBe(1);
            var args = node.codegenNode.arguments;
            expect(args.length).toBe(2);
            expect(args[1].properties[0].value).toMatchObject({
                type: 20,
                index: 1,
                value: {
                    type: 8,
                    children: ["$event => (", { content: "_ctx.foo" }, "++", ")"]
                }
            });
        });
    });
});
