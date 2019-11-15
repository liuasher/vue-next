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
var vIf_1 = require("../../src/transforms/vIf");
var transformExpression_1 = require("../../src/transforms/transformExpression");
function parseWithExpressionTransform(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ prefixIdentifiers: true, nodeTransforms: [vIf_1.transformIf, transformExpression_1.transformExpression] }, options));
    return ast.children[0];
}
describe('compiler: expression transform', function () {
    test('interpolation (root)', function () {
        var node = parseWithExpressionTransform("{{ foo }}");
        expect(node.content).toMatchObject({
            type: 4,
            content: "_ctx.foo"
        });
    });
    test('empty interpolation', function () {
        var node = parseWithExpressionTransform("{{}}");
        var node2 = parseWithExpressionTransform("{{ }}");
        var node3 = parseWithExpressionTransform("<div>{{ }}</div>");
        var objectToBeMatched = {
            type: 4,
            content: ""
        };
        expect(node.content).toMatchObject(objectToBeMatched);
        expect(node2.content).toMatchObject(objectToBeMatched);
        expect(node3.children[0].content).toMatchObject(objectToBeMatched);
    });
    test('interpolation (children)', function () {
        var el = parseWithExpressionTransform("<div>{{ foo }}</div>");
        var node = el.children[0];
        expect(node.content).toMatchObject({
            type: 4,
            content: "_ctx.foo"
        });
    });
    test('interpolation (complex)', function () {
        var el = parseWithExpressionTransform("<div>{{ foo + bar(baz.qux) }}</div>");
        var node = el.children[0];
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                { content: "_ctx.foo" },
                " + ",
                { content: "_ctx.bar" },
                "(",
                { content: "_ctx.baz" },
                ".",
                { content: "qux" },
                ")"
            ]
        });
    });
    test('directive value', function () {
        var node = parseWithExpressionTransform("<div v-foo:arg=\"baz\"/>");
        var arg = node.props[0].arg;
        expect(arg).toMatchObject({
            type: 4,
            content: "arg"
        });
        var exp = node.props[0].exp;
        expect(exp).toMatchObject({
            type: 4,
            content: "_ctx.baz"
        });
    });
    test('dynamic directive arg', function () {
        var node = parseWithExpressionTransform("<div v-foo:[arg]=\"baz\"/>");
        var arg = node.props[0].arg;
        expect(arg).toMatchObject({
            type: 4,
            content: "_ctx.arg"
        });
        var exp = node.props[0].exp;
        expect(exp).toMatchObject({
            type: 4,
            content: "_ctx.baz"
        });
    });
    test('should prefix complex expressions', function () {
        var node = parseWithExpressionTransform("{{ foo(baz + 1, { key: kuz }) }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                {
                    content: "_ctx.foo",
                    loc: {
                        source: "foo",
                        start: {
                            offset: 3,
                            line: 1,
                            column: 4
                        },
                        end: {
                            offset: 6,
                            line: 1,
                            column: 7
                        }
                    }
                },
                "(",
                {
                    content: "_ctx.baz",
                    loc: {
                        source: "baz",
                        start: {
                            offset: 7,
                            line: 1,
                            column: 8
                        },
                        end: {
                            offset: 10,
                            line: 1,
                            column: 11
                        }
                    }
                },
                " + 1, { key: ",
                {
                    content: "_ctx.kuz",
                    loc: {
                        source: "kuz",
                        start: {
                            offset: 23,
                            line: 1,
                            column: 24
                        },
                        end: {
                            offset: 26,
                            line: 1,
                            column: 27
                        }
                    }
                },
                " })"
            ]
        });
    });
    test('should not prefix whitelisted globals', function () {
        var node = parseWithExpressionTransform("{{ Math.max(1, 2) }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [{ content: "Math" }, ".", { content: "max" }, "(1, 2)"]
        });
    });
    test('should not prefix reserved literals', function () {
        function assert(exp) {
            var node = parseWithExpressionTransform("{{ " + exp + " }}");
            expect(node.content).toMatchObject({
                type: 4,
                content: exp
            });
        }
        assert("true");
        assert("false");
        assert("null");
        assert("this");
    });
    test('should not prefix id of a function declaration', function () {
        var node = parseWithExpressionTransform("{{ function foo() { return bar } }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                "function ",
                { content: "foo" },
                "() { return ",
                { content: "_ctx.bar" },
                " }"
            ]
        });
    });
    test('should not prefix params of a function expression', function () {
        var node = parseWithExpressionTransform("{{ foo => foo + bar }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                { content: "foo" },
                " => ",
                { content: "foo" },
                " + ",
                { content: "_ctx.bar" }
            ]
        });
    });
    test('should prefix default value of a function expression param', function () {
        var node = parseWithExpressionTransform("{{ (foo = baz) => foo + bar }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                "(",
                { content: "foo" },
                " = ",
                { content: "_ctx.baz" },
                ") => ",
                { content: "foo" },
                " + ",
                { content: "_ctx.bar" }
            ]
        });
    });
    test('should not prefix function param destructuring', function () {
        var node = parseWithExpressionTransform("{{ ({ foo }) => foo + bar }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                "({ ",
                { content: "foo" },
                " }) => ",
                { content: "foo" },
                " + ",
                { content: "_ctx.bar" }
            ]
        });
    });
    test('function params should not affect out of scope identifiers', function () {
        var node = parseWithExpressionTransform("{{ { a: foo => foo, b: foo } }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                "{ a: ",
                { content: "foo" },
                " => ",
                { content: "foo" },
                ", b: ",
                { content: "_ctx.foo" },
                " }"
            ]
        });
    });
    test('should prefix default value of function param destructuring', function () {
        var node = parseWithExpressionTransform("{{ ({ foo = bar }) => foo + bar }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                "({ ",
                { content: "foo" },
                " = ",
                { content: "_ctx.bar" },
                " }) => ",
                { content: "foo" },
                " + ",
                { content: "_ctx.bar" }
            ]
        });
    });
    test('should not prefix an object property key', function () {
        var node = parseWithExpressionTransform("{{ { foo: bar } }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: ["{ foo: ", { content: "_ctx.bar" }, " }"]
        });
    });
    test('should prefix a computed object property key', function () {
        var node = parseWithExpressionTransform("{{ { [foo]: bar } }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                "{ [",
                { content: "_ctx.foo" },
                "]: ",
                { content: "_ctx.bar" },
                " }"
            ]
        });
    });
    test('should prefix object property shorthand value', function () {
        var node = parseWithExpressionTransform("{{ { foo } }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: ["{ foo: ", { content: "_ctx.foo" }, " }"]
        });
    });
    test('should not prefix id in a member expression', function () {
        var node = parseWithExpressionTransform("{{ foo.bar.baz }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                { content: "_ctx.foo" },
                ".",
                { content: "bar" },
                ".",
                { content: "baz" }
            ]
        });
    });
    test('should prefix computed id in a member expression', function () {
        var node = parseWithExpressionTransform("{{ foo[bar][baz] }}");
        expect(node.content).toMatchObject({
            type: 8,
            children: [
                { content: "_ctx.foo" },
                "[",
                { content: "_ctx.bar" },
                "][",
                { content: '_ctx.baz' },
                "]"
            ]
        });
    });
    test('should handle parse error', function () {
        var onError = jest.fn();
        parseWithExpressionTransform("{{ a( }}", { onError: onError });
        expect(onError.mock.calls[0][0].message).toMatch("Invalid JavaScript expression. (1:4)");
    });
});
