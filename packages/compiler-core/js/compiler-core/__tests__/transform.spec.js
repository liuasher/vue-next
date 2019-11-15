"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parse_1 = require("../src/parse");
var transform_1 = require("../src/transform");
var errors_1 = require("../src/errors");
var runtimeHelpers_1 = require("../src/runtimeHelpers");
var vIf_1 = require("../src/transforms/vIf");
var vFor_1 = require("../src/transforms/vFor");
var transformElement_1 = require("../src/transforms/transformElement");
var transformSlotOutlet_1 = require("../src/transforms/transformSlotOutlet");
var transformText_1 = require("../src/transforms/transformText");
describe('compiler: transform', function () {
    test('context state', function () {
        var ast = parse_1.parse("<div>hello {{ world }}</div>");
        var calls = [];
        var plugin = function (node, context) {
            calls.push([node, Object.assign({}, context)]);
        };
        transform_1.transform(ast, {
            nodeTransforms: [plugin]
        });
        var div = ast.children[0];
        expect(calls.length).toBe(4);
        expect(calls[0]).toMatchObject([
            ast,
            {
                parent: null,
                currentNode: ast
            }
        ]);
        expect(calls[1]).toMatchObject([
            div,
            {
                parent: ast,
                currentNode: div
            }
        ]);
        expect(calls[2]).toMatchObject([
            div.children[0],
            {
                parent: div,
                currentNode: div.children[0]
            }
        ]);
        expect(calls[3]).toMatchObject([
            div.children[1],
            {
                parent: div,
                currentNode: div.children[1]
            }
        ]);
    });
    test('context.replaceNode', function () {
        var ast = parse_1.parse("<div/><span/>");
        var plugin = function (node, context) {
            if (node.type === 1 && node.tag === 'div') {
                context.replaceNode(Object.assign({}, node, {
                    tag: 'p',
                    children: [
                        {
                            type: 2,
                            content: 'hello',
                            isEmpty: false
                        }
                    ]
                }));
            }
        };
        var spy = jest.fn(plugin);
        transform_1.transform(ast, {
            nodeTransforms: [spy]
        });
        expect(ast.children.length).toBe(2);
        var newElement = ast.children[0];
        expect(newElement.tag).toBe('p');
        expect(spy).toHaveBeenCalledTimes(4);
        expect(spy.mock.calls[2][0]).toBe(newElement.children[0]);
        expect(spy.mock.calls[3][0]).toBe(ast.children[1]);
    });
    test('context.removeNode', function () {
        var ast = parse_1.parse("<span/><div>hello</div><span/>");
        var c1 = ast.children[0];
        var c2 = ast.children[2];
        var plugin = function (node, context) {
            if (node.type === 1 && node.tag === 'div') {
                context.removeNode();
            }
        };
        var spy = jest.fn(plugin);
        transform_1.transform(ast, {
            nodeTransforms: [spy]
        });
        expect(ast.children.length).toBe(2);
        expect(ast.children[0]).toBe(c1);
        expect(ast.children[1]).toBe(c2);
        expect(spy).toHaveBeenCalledTimes(4);
        expect(spy.mock.calls[1][0]).toBe(c1);
        expect(spy.mock.calls[3][0]).toBe(c2);
    });
    test('context.removeNode (prev sibling)', function () {
        var ast = parse_1.parse("<span/><div/><span/>");
        var c1 = ast.children[0];
        var c2 = ast.children[2];
        var plugin = function (node, context) {
            if (node.type === 1 && node.tag === 'div') {
                context.removeNode();
                context.removeNode(context.parent.children[0]);
            }
        };
        var spy = jest.fn(plugin);
        transform_1.transform(ast, {
            nodeTransforms: [spy]
        });
        expect(ast.children.length).toBe(1);
        expect(ast.children[0]).toBe(c2);
        expect(spy).toHaveBeenCalledTimes(4);
        expect(spy.mock.calls[1][0]).toBe(c1);
        expect(spy.mock.calls[3][0]).toBe(c2);
    });
    test('context.removeNode (next sibling)', function () {
        var ast = parse_1.parse("<span/><div/><span/>");
        var c1 = ast.children[0];
        var d1 = ast.children[1];
        var plugin = function (node, context) {
            if (node.type === 1 && node.tag === 'div') {
                context.removeNode();
                context.removeNode(context.parent.children[1]);
            }
        };
        var spy = jest.fn(plugin);
        transform_1.transform(ast, {
            nodeTransforms: [spy]
        });
        expect(ast.children.length).toBe(1);
        expect(ast.children[0]).toBe(c1);
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.mock.calls[1][0]).toBe(c1);
        expect(spy.mock.calls[2][0]).toBe(d1);
    });
    test('context.hoist', function () {
        var ast = parse_1.parse("<div :id=\"foo\"/><div :id=\"bar\"/>");
        var hoisted = [];
        var mock = function (node, context) {
            if (node.type === 1) {
                var dir = node.props[0];
                hoisted.push(dir.exp);
                dir.exp = context.hoist(dir.exp);
            }
        };
        transform_1.transform(ast, {
            nodeTransforms: [mock]
        });
        expect(ast.hoists).toMatchObject(hoisted);
        expect(ast.children[0].props[0].exp.content).toBe("_hoisted_1");
        expect(ast.children[1].props[0].exp.content).toBe("_hoisted_2");
    });
    test('onError option', function () {
        var ast = parse_1.parse("<div/>");
        var loc = ast.children[0].loc;
        var plugin = function (node, context) {
            context.onError(errors_1.createCompilerError(31, node.loc));
        };
        var spy = jest.fn();
        transform_1.transform(ast, {
            nodeTransforms: [plugin],
            onError: spy
        });
        expect(spy.mock.calls[0]).toMatchObject([
            {
                code: 31,
                loc: loc
            }
        ]);
    });
    test('should inject toString helper for interpolations', function () {
        var ast = parse_1.parse("{{ foo }}");
        transform_1.transform(ast, {});
        expect(ast.helpers).toContain(runtimeHelpers_1.TO_STRING);
    });
    test('should inject createVNode and Comment for comments', function () {
        var ast = parse_1.parse("<!--foo-->");
        transform_1.transform(ast, {});
        expect(ast.helpers).toContain(runtimeHelpers_1.CREATE_COMMENT);
    });
    describe('root codegenNode', function () {
        function transformWithCodegen(template) {
            var ast = parse_1.parse(template);
            transform_1.transform(ast, {
                nodeTransforms: [
                    vIf_1.transformIf,
                    vFor_1.transformFor,
                    transformText_1.transformText,
                    transformSlotOutlet_1.transformSlotOutlet,
                    transformElement_1.transformElement
                ]
            });
            return ast;
        }
        function createBlockMatcher(args) {
            return {
                type: 18,
                expressions: [
                    {
                        type: 13,
                        callee: runtimeHelpers_1.OPEN_BLOCK
                    },
                    {
                        type: 13,
                        callee: runtimeHelpers_1.CREATE_BLOCK,
                        arguments: args
                    }
                ]
            };
        }
        test('no children', function () {
            var ast = transformWithCodegen("");
            expect(ast.codegenNode).toBeUndefined();
        });
        test('single <slot/>', function () {
            var ast = transformWithCodegen("<slot/>");
            expect(ast.codegenNode).toMatchObject({
                codegenNode: {
                    type: 13,
                    callee: runtimeHelpers_1.RENDER_SLOT
                }
            });
        });
        test('single element', function () {
            var ast = transformWithCodegen("<div/>");
            expect(ast.codegenNode).toMatchObject(createBlockMatcher(["\"div\""]));
        });
        test('root v-if', function () {
            var ast = transformWithCodegen("<div v-if=\"ok\" />");
            expect(ast.codegenNode).toMatchObject({
                type: 9
            });
        });
        test('root v-for', function () {
            var ast = transformWithCodegen("<div v-for=\"i in list\" />");
            expect(ast.codegenNode).toMatchObject({
                type: 11
            });
        });
        test('root element with custom directive', function () {
            var ast = transformWithCodegen("<div v-foo/>");
            expect(ast.codegenNode).toMatchObject({
                type: 18,
                expressions: [
                    {
                        type: 13,
                        callee: runtimeHelpers_1.OPEN_BLOCK
                    },
                    {
                        type: 13,
                        callee: runtimeHelpers_1.WITH_DIRECTIVES,
                        arguments: [
                            { callee: runtimeHelpers_1.CREATE_BLOCK },
                            { type: 16 }
                        ]
                    }
                ]
            });
        });
        test('single text', function () {
            var ast = transformWithCodegen("hello");
            expect(ast.codegenNode).toMatchObject({
                type: 2
            });
        });
        test('single interpolation', function () {
            var ast = transformWithCodegen("{{ foo }}");
            expect(ast.codegenNode).toMatchObject({
                type: 5
            });
        });
        test('single CompoundExpression', function () {
            var ast = transformWithCodegen("{{ foo }} bar baz");
            expect(ast.codegenNode).toMatchObject({
                type: 8
            });
        });
        test('multiple children', function () {
            var ast = transformWithCodegen("<div/><div/>");
            expect(ast.codegenNode).toMatchObject(createBlockMatcher([
                runtimeHelpers_1.FRAGMENT,
                "null",
                [
                    { type: 1, tag: "div" },
                    { type: 1, tag: "div" }
                ]
            ]));
        });
    });
});
