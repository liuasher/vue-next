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
var parse_1 = require("../../src/parse");
var transform_1 = require("../../src/transform");
var vIf_1 = require("../../src/transforms/vIf");
var transformElement_1 = require("../../src/transforms/transformElement");
var transformSlotOutlet_1 = require("../../src/transforms/transformSlotOutlet");
var src_1 = require("../../src");
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var testUtils_1 = require("../testUtils");
function parseWithIfTransform(template, options, returnIndex) {
    if (options === void 0) { options = {}; }
    if (returnIndex === void 0) { returnIndex = 0; }
    var ast = parse_1.parse(template, options);
    transform_1.transform(ast, __assign({ nodeTransforms: [vIf_1.transformIf, transformSlotOutlet_1.transformSlotOutlet, transformElement_1.transformElement] }, options));
    if (!options.onError) {
        expect(ast.children.length).toBe(1);
        expect(ast.children[0].type).toBe(9);
    }
    return {
        root: ast,
        node: ast.children[returnIndex]
    };
}
describe('compiler: v-if', function () {
    describe('transform', function () {
        test('basic v-if', function () {
            var node = parseWithIfTransform("<div v-if=\"ok\"/>").node;
            expect(node.type).toBe(9);
            expect(node.branches.length).toBe(1);
            expect(node.branches[0].condition.content).toBe("ok");
            expect(node.branches[0].children.length).toBe(1);
            expect(node.branches[0].children[0].type).toBe(1);
            expect(node.branches[0].children[0].tag).toBe("div");
        });
        test('template v-if', function () {
            var node = parseWithIfTransform("<template v-if=\"ok\"><div/>hello<p/></template>").node;
            expect(node.type).toBe(9);
            expect(node.branches.length).toBe(1);
            expect(node.branches[0].condition.content).toBe("ok");
            expect(node.branches[0].children.length).toBe(3);
            expect(node.branches[0].children[0].type).toBe(1);
            expect(node.branches[0].children[0].tag).toBe("div");
            expect(node.branches[0].children[1].type).toBe(2);
            expect(node.branches[0].children[1].content).toBe("hello");
            expect(node.branches[0].children[2].type).toBe(1);
            expect(node.branches[0].children[2].tag).toBe("p");
        });
        test('v-if + v-else', function () {
            var node = parseWithIfTransform("<div v-if=\"ok\"/><p v-else/>").node;
            expect(node.type).toBe(9);
            expect(node.branches.length).toBe(2);
            var b1 = node.branches[0];
            expect(b1.condition.content).toBe("ok");
            expect(b1.children.length).toBe(1);
            expect(b1.children[0].type).toBe(1);
            expect(b1.children[0].tag).toBe("div");
            var b2 = node.branches[1];
            expect(b2.condition).toBeUndefined();
            expect(b2.children.length).toBe(1);
            expect(b2.children[0].type).toBe(1);
            expect(b2.children[0].tag).toBe("p");
        });
        test('v-if + v-else-if', function () {
            var node = parseWithIfTransform("<div v-if=\"ok\"/><p v-else-if=\"orNot\"/>").node;
            expect(node.type).toBe(9);
            expect(node.branches.length).toBe(2);
            var b1 = node.branches[0];
            expect(b1.condition.content).toBe("ok");
            expect(b1.children.length).toBe(1);
            expect(b1.children[0].type).toBe(1);
            expect(b1.children[0].tag).toBe("div");
            var b2 = node.branches[1];
            expect(b2.condition.content).toBe("orNot");
            expect(b2.children.length).toBe(1);
            expect(b2.children[0].type).toBe(1);
            expect(b2.children[0].tag).toBe("p");
        });
        test('v-if + v-else-if + v-else', function () {
            var node = parseWithIfTransform("<div v-if=\"ok\"/><p v-else-if=\"orNot\"/><template v-else>fine</template>").node;
            expect(node.type).toBe(9);
            expect(node.branches.length).toBe(3);
            var b1 = node.branches[0];
            expect(b1.condition.content).toBe("ok");
            expect(b1.children.length).toBe(1);
            expect(b1.children[0].type).toBe(1);
            expect(b1.children[0].tag).toBe("div");
            var b2 = node.branches[1];
            expect(b2.condition.content).toBe("orNot");
            expect(b2.children.length).toBe(1);
            expect(b2.children[0].type).toBe(1);
            expect(b2.children[0].tag).toBe("p");
            var b3 = node.branches[2];
            expect(b3.condition).toBeUndefined();
            expect(b3.children.length).toBe(1);
            expect(b3.children[0].type).toBe(2);
            expect(b3.children[0].content).toBe("fine");
        });
        test('comment between branches', function () {
            var node = parseWithIfTransform("\n        <div v-if=\"ok\"/>\n        <!--foo-->\n        <p v-else-if=\"orNot\"/>\n        <!--bar-->\n        <template v-else>fine</template>\n      ").node;
            expect(node.type).toBe(9);
            expect(node.branches.length).toBe(3);
            var b1 = node.branches[0];
            expect(b1.condition.content).toBe("ok");
            expect(b1.children.length).toBe(1);
            expect(b1.children[0].type).toBe(1);
            expect(b1.children[0].tag).toBe("div");
            var b2 = node.branches[1];
            expect(b2.condition.content).toBe("orNot");
            expect(b2.children.length).toBe(2);
            expect(b2.children[0].type).toBe(3);
            expect(b2.children[0].content).toBe("foo");
            expect(b2.children[1].type).toBe(1);
            expect(b2.children[1].tag).toBe("p");
            var b3 = node.branches[2];
            expect(b3.condition).toBeUndefined();
            expect(b3.children.length).toBe(2);
            expect(b3.children[0].type).toBe(3);
            expect(b3.children[0].content).toBe("bar");
            expect(b3.children[1].type).toBe(2);
            expect(b3.children[1].content).toBe("fine");
        });
        test('should prefix v-if condition', function () {
            var node = parseWithIfTransform("<div v-if=\"ok\"/>", {
                prefixIdentifiers: true
            }).node;
            expect(node.branches[0].condition).toMatchObject({
                type: 4,
                content: "_ctx.ok"
            });
        });
    });
    describe('errors', function () {
        test('error on v-else missing adjacent v-if', function () {
            var onError = jest.fn();
            var node1 = parseWithIfTransform("<div v-else/>", { onError: onError }).node;
            expect(onError.mock.calls[0]).toMatchObject([
                {
                    code: 36,
                    loc: node1.loc
                }
            ]);
            var node2 = parseWithIfTransform("<div/><div v-else/>", { onError: onError }, 1).node;
            expect(onError.mock.calls[1]).toMatchObject([
                {
                    code: 36,
                    loc: node2.loc
                }
            ]);
            var node3 = parseWithIfTransform("<div/>foo<div v-else/>", { onError: onError }, 2).node;
            expect(onError.mock.calls[2]).toMatchObject([
                {
                    code: 36,
                    loc: node3.loc
                }
            ]);
        });
        test('error on v-else-if missing adjacent v-if', function () {
            var onError = jest.fn();
            var node1 = parseWithIfTransform("<div v-else-if=\"foo\"/>", {
                onError: onError
            }).node;
            expect(onError.mock.calls[0]).toMatchObject([
                {
                    code: 36,
                    loc: node1.loc
                }
            ]);
            var node2 = parseWithIfTransform("<div/><div v-else-if=\"foo\"/>", { onError: onError }, 1).node;
            expect(onError.mock.calls[1]).toMatchObject([
                {
                    code: 36,
                    loc: node2.loc
                }
            ]);
            var node3 = parseWithIfTransform("<div/>foo<div v-else-if=\"foo\"/>", { onError: onError }, 2).node;
            expect(onError.mock.calls[2]).toMatchObject([
                {
                    code: 36,
                    loc: node3.loc
                }
            ]);
        });
    });
    describe('codegen', function () {
        function assertSharedCodegen(node, depth, hasElse) {
            if (depth === void 0) { depth = 0; }
            if (hasElse === void 0) { hasElse = false; }
            expect(node).toMatchObject({
                type: 18,
                expressions: [
                    {
                        type: 13,
                        callee: runtimeHelpers_1.OPEN_BLOCK,
                        arguments: []
                    },
                    {
                        type: 19,
                        test: {
                            content: "ok"
                        },
                        consequent: {
                            type: 13,
                            callee: runtimeHelpers_1.CREATE_BLOCK
                        },
                        alternate: depth < 1
                            ? {
                                type: 13,
                                callee: hasElse ? runtimeHelpers_1.CREATE_BLOCK : runtimeHelpers_1.CREATE_COMMENT
                            }
                            : {
                                type: 19,
                                test: {
                                    content: "orNot"
                                },
                                consequent: {
                                    type: 13,
                                    callee: runtimeHelpers_1.CREATE_BLOCK
                                },
                                alternate: {
                                    type: 13,
                                    callee: hasElse ? runtimeHelpers_1.CREATE_BLOCK : runtimeHelpers_1.CREATE_COMMENT
                                }
                            }
                    }
                ]
            });
        }
        test('basic v-if', function () {
            var _a = parseWithIfTransform("<div v-if=\"ok\"/>"), root = _a.root, codegenNode = _a.node.codegenNode;
            assertSharedCodegen(codegenNode);
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments).toMatchObject([
                "\"div\"",
                testUtils_1.createObjectMatcher({ key: "[0]" })
            ]);
            var branch2 = codegenNode.expressions[1]
                .alternate;
            expect(branch2).toMatchObject({
                type: 13,
                callee: runtimeHelpers_1.CREATE_COMMENT
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('template v-if', function () {
            var _a = parseWithIfTransform("<template v-if=\"ok\"><div/>hello<p/></template>"), root = _a.root, codegenNode = _a.node.codegenNode;
            assertSharedCodegen(codegenNode);
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments).toMatchObject([
                runtimeHelpers_1.FRAGMENT,
                testUtils_1.createObjectMatcher({ key: "[0]" }),
                [
                    { type: 1, tag: 'div' },
                    { type: 2, content: "hello" },
                    { type: 1, tag: 'p' }
                ]
            ]);
            var branch2 = codegenNode.expressions[1]
                .alternate;
            expect(branch2).toMatchObject({
                type: 13,
                callee: runtimeHelpers_1.CREATE_COMMENT
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('template v-if w/ single <slot/> child', function () {
            var _a = parseWithIfTransform("<template v-if=\"ok\"><slot/></template>"), root = _a.root, codegenNode = _a.node.codegenNode;
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1).toMatchObject({
                type: 13,
                callee: runtimeHelpers_1.RENDER_SLOT,
                arguments: ['$slots', '"default"', testUtils_1.createObjectMatcher({ key: "[0]" })]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('v-if on <slot/>', function () {
            var _a = parseWithIfTransform("<slot v-if=\"ok\"></slot>"), root = _a.root, codegenNode = _a.node.codegenNode;
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1).toMatchObject({
                type: 13,
                callee: runtimeHelpers_1.RENDER_SLOT,
                arguments: ['$slots', '"default"', testUtils_1.createObjectMatcher({ key: "[0]" })]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('v-if + v-else', function () {
            var _a = parseWithIfTransform("<div v-if=\"ok\"/><p v-else/>"), root = _a.root, codegenNode = _a.node.codegenNode;
            assertSharedCodegen(codegenNode, 0, true);
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments).toMatchObject([
                "\"div\"",
                testUtils_1.createObjectMatcher({ key: "[0]" })
            ]);
            var branch2 = codegenNode.expressions[1]
                .alternate;
            expect(branch2.arguments).toMatchObject([
                "\"p\"",
                testUtils_1.createObjectMatcher({ key: "[1]" })
            ]);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('v-if + v-else-if', function () {
            var _a = parseWithIfTransform("<div v-if=\"ok\"/><p v-else-if=\"orNot\" />"), root = _a.root, codegenNode = _a.node.codegenNode;
            assertSharedCodegen(codegenNode, 1);
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments).toMatchObject([
                "\"div\"",
                testUtils_1.createObjectMatcher({ key: "[0]" })
            ]);
            var branch2 = codegenNode.expressions[1]
                .alternate;
            expect(branch2.consequent.arguments).toMatchObject([
                "\"p\"",
                testUtils_1.createObjectMatcher({ key: "[1]" })
            ]);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('v-if + v-else-if + v-else', function () {
            var _a = parseWithIfTransform("<div v-if=\"ok\"/><p v-else-if=\"orNot\"/><template v-else>fine</template>"), root = _a.root, codegenNode = _a.node.codegenNode;
            assertSharedCodegen(codegenNode, 1, true);
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments).toMatchObject([
                "\"div\"",
                testUtils_1.createObjectMatcher({ key: "[0]" })
            ]);
            var branch2 = codegenNode.expressions[1]
                .alternate;
            expect(branch2.consequent.arguments).toMatchObject([
                "\"p\"",
                testUtils_1.createObjectMatcher({ key: "[1]" })
            ]);
            expect(branch2.alternate.arguments).toMatchObject([
                runtimeHelpers_1.FRAGMENT,
                testUtils_1.createObjectMatcher({ key: "[2]" }),
                [
                    {
                        type: 2,
                        content: "fine"
                    }
                ]
            ]);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('key injection (only v-bind)', function () {
            var codegenNode = parseWithIfTransform("<div v-if=\"ok\" v-bind=\"obj\"/>").node.codegenNode;
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments[1]).toMatchObject({
                type: 13,
                callee: runtimeHelpers_1.MERGE_PROPS,
                arguments: [testUtils_1.createObjectMatcher({ key: "[0]" }), { content: "obj" }]
            });
        });
        test('key injection (before v-bind)', function () {
            var codegenNode = parseWithIfTransform("<div v-if=\"ok\" id=\"foo\" v-bind=\"obj\"/>").node.codegenNode;
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments[1]).toMatchObject({
                type: 13,
                callee: runtimeHelpers_1.MERGE_PROPS,
                arguments: [
                    testUtils_1.createObjectMatcher({
                        key: '[0]',
                        id: 'foo'
                    }),
                    { content: "obj" }
                ]
            });
        });
        test('key injection (after v-bind)', function () {
            var codegenNode = parseWithIfTransform("<div v-if=\"ok\" v-bind=\"obj\" id=\"foo\"/>").node.codegenNode;
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.arguments[1]).toMatchObject({
                type: 13,
                callee: runtimeHelpers_1.MERGE_PROPS,
                arguments: [
                    testUtils_1.createObjectMatcher({ key: "[0]" }),
                    { content: "obj" },
                    testUtils_1.createObjectMatcher({
                        id: 'foo'
                    })
                ]
            });
        });
        test('key injection (w/ custom directive)', function () {
            var codegenNode = parseWithIfTransform("<div v-if=\"ok\" v-foo />").node.codegenNode;
            var branch1 = codegenNode.expressions[1]
                .consequent;
            expect(branch1.callee).toBe(runtimeHelpers_1.WITH_DIRECTIVES);
            var realBranch = branch1.arguments[0];
            expect(realBranch.arguments[1]).toMatchObject(testUtils_1.createObjectMatcher({ key: "[0]" }));
        });
        test.todo('with comments');
    });
});
