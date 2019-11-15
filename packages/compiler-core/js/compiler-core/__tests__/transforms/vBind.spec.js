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
var vBind_1 = require("../../src/transforms/vBind");
var transformElement_1 = require("../../src/transforms/transformElement");
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var transformExpression_1 = require("../../src/transforms/transformExpression");
function parseWithVBind(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ nodeTransforms: __spreadArrays((options.prefixIdentifiers ? [transformExpression_1.transformExpression] : []), [
            transformElement_1.transformElement
        ]), directiveTransforms: {
            bind: vBind_1.transformBind
        } }, options));
    return ast.children[0];
}
describe('compiler: transform v-bind', function () {
    test('basic', function () {
        var node = parseWithVBind("<div v-bind:id=\"id\"/>");
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                content: "id",
                isStatic: true,
                loc: {
                    start: {
                        line: 1,
                        column: 13
                    },
                    end: {
                        line: 1,
                        column: 15
                    }
                }
            },
            value: {
                content: "id",
                isStatic: false,
                loc: {
                    start: {
                        line: 1,
                        column: 17
                    },
                    end: {
                        line: 1,
                        column: 19
                    }
                }
            }
        });
    });
    test('dynamic arg', function () {
        var node = parseWithVBind("<div v-bind:[id]=\"id\"/>");
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                content: "id",
                isStatic: false
            },
            value: {
                content: "id",
                isStatic: false
            }
        });
    });
    test('should error if no expression', function () {
        var onError = jest.fn();
        parseWithVBind("<div v-bind:arg />", { onError: onError });
        expect(onError.mock.calls[0][0]).toMatchObject({
            code: 39,
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
    test('.camel modifier', function () {
        var node = parseWithVBind("<div v-bind:foo-bar.camel=\"id\"/>");
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                content: "fooBar",
                isStatic: true
            },
            value: {
                content: "id",
                isStatic: false
            }
        });
    });
    test('.camel modifier w/ dynamic arg', function () {
        var node = parseWithVBind("<div v-bind:[foo].camel=\"id\"/>");
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                content: "_" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CAMELIZE] + "(foo)",
                isStatic: false
            },
            value: {
                content: "id",
                isStatic: false
            }
        });
    });
    test('.camel modifier w/ dynamic arg + prefixIdentifiers', function () {
        var node = parseWithVBind("<div v-bind:[foo(bar)].camel=\"id\"/>", {
            prefixIdentifiers: true
        });
        var props = node.codegenNode
            .arguments[1];
        expect(props.properties[0]).toMatchObject({
            key: {
                children: [
                    runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CAMELIZE] + "(",
                    { content: "_ctx.foo" },
                    "(",
                    { content: "_ctx.bar" },
                    ")",
                    ")"
                ]
            },
            value: {
                content: "_ctx.id",
                isStatic: false
            }
        });
    });
});
