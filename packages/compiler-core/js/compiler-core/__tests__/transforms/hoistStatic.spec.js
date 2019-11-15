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
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var transformElement_1 = require("../../src/transforms/transformElement");
var transformExpression_1 = require("../../src/transforms/transformExpression");
var vIf_1 = require("../../src/transforms/vIf");
var vFor_1 = require("../../src/transforms/vFor");
var vBind_1 = require("../../src/transforms/vBind");
var vOn_1 = require("../../src/transforms/vOn");
var testUtils_1 = require("../testUtils");
var shared_1 = require("@vue/shared");
function transformWithHoist(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ hoistStatic: true, nodeTransforms: __spreadArrays([
            vIf_1.transformIf,
            vFor_1.transformFor
        ], (options.prefixIdentifiers ? [transformExpression_1.transformExpression] : []), [
            transformElement_1.transformElement
        ]), directiveTransforms: {
            on: vOn_1.transformOn,
            bind: vBind_1.transformBind
        } }, options));
    expect(ast.codegenNode).toMatchObject({
        type: 18,
        expressions: [
            {
                type: 13,
                callee: runtimeHelpers_1.OPEN_BLOCK
            },
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_BLOCK
            }
        ]
    });
    return {
        root: ast,
        args: ast.codegenNode.expressions[1].arguments
    };
}
describe('compiler: hoistStatic transform', function () {
    test('should NOT hoist root node', function () {
        var _a = transformWithHoist("<div/>"), root = _a.root, args = _a.args;
        expect(root.hoists.length).toBe(0);
        expect(args).toEqual(["\"div\""]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist simple element', function () {
        var _a = transformWithHoist("<div><span class=\"inline\">hello</span></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: [
                    "\"span\"",
                    testUtils_1.createObjectMatcher({ class: 'inline' }),
                    {
                        type: 2,
                        content: "hello"
                    }
                ]
            }
        ]);
        expect(args).toMatchObject([
            "\"div\"",
            "null",
            [
                {
                    type: 1,
                    codegenNode: {
                        type: 4,
                        content: "_hoisted_1"
                    }
                }
            ]
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist nested static tree', function () {
        var _a = transformWithHoist("<div><p><span/><span/></p></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: [
                    "\"p\"",
                    "null",
                    [
                        { type: 1, tag: "span" },
                        { type: 1, tag: "span" }
                    ]
                ]
            }
        ]);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    type: 4,
                    content: "_hoisted_1"
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist nested static tree with comments', function () {
        var _a = transformWithHoist("<div><div><!--comment--></div></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: [
                    "\"div\"",
                    "null",
                    [{ type: 3, content: "comment" }]
                ]
            }
        ]);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    type: 4,
                    content: "_hoisted_1"
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist siblings with common non-hoistable parent', function () {
        var _a = transformWithHoist("<div><span/><div/></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: ["\"span\""]
            },
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: ["\"div\""]
            }
        ]);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    type: 4,
                    content: "_hoisted_1"
                }
            },
            {
                type: 1,
                codegenNode: {
                    type: 4,
                    content: "_hoisted_2"
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('should NOT hoist components', function () {
        var _a = transformWithHoist("<div><Comp/></div>"), root = _a.root, args = _a.args;
        expect(root.hoists.length).toBe(0);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: ["_component_Comp"]
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('should NOT hoist element with dynamic props', function () {
        var _a = transformWithHoist("<div><div :id=\"foo\"/></div>"), root = _a.root, args = _a.args;
        expect(root.hoists.length).toBe(0);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: [
                        "\"div\"",
                        testUtils_1.createObjectMatcher({
                            id: "[foo]"
                        }),
                        "null",
                        testUtils_1.genFlagText(shared_1.PatchFlags.PROPS),
                        "[\"id\"]"
                    ]
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist element with static key', function () {
        var _a = transformWithHoist("<div><div key=\"foo\"/></div>"), root = _a.root, args = _a.args;
        expect(root.hoists.length).toBe(1);
        expect(root.hoists).toMatchObject([
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: ["\"div\"", testUtils_1.createObjectMatcher({ key: 'foo' })]
            }
        ]);
        expect(args).toMatchObject([
            "\"div\"",
            "null",
            [
                {
                    type: 1,
                    codegenNode: {
                        type: 4,
                        content: "_hoisted_1"
                    }
                }
            ]
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('should NOT hoist element with dynamic key', function () {
        var _a = transformWithHoist("<div><div :key=\"foo\"/></div>"), root = _a.root, args = _a.args;
        expect(root.hoists.length).toBe(0);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: [
                        "\"div\"",
                        testUtils_1.createObjectMatcher({
                            key: "[foo]"
                        })
                    ]
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('should NOT hoist element with dynamic ref', function () {
        var _a = transformWithHoist("<div><div :ref=\"foo\"/></div>"), root = _a.root, args = _a.args;
        expect(root.hoists.length).toBe(0);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: [
                        "\"div\"",
                        testUtils_1.createObjectMatcher({
                            ref: "[foo]"
                        }),
                        "null",
                        testUtils_1.genFlagText(shared_1.PatchFlags.NEED_PATCH)
                    ]
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist static props for elements with directives', function () {
        var _a = transformWithHoist("<div><div id=\"foo\" v-foo/></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([testUtils_1.createObjectMatcher({ id: 'foo' })]);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    callee: runtimeHelpers_1.WITH_DIRECTIVES,
                    arguments: [
                        {
                            callee: runtimeHelpers_1.CREATE_VNODE,
                            arguments: [
                                "\"div\"",
                                {
                                    type: 4,
                                    content: "_hoisted_1"
                                },
                                "null",
                                testUtils_1.genFlagText(shared_1.PatchFlags.NEED_PATCH)
                            ]
                        },
                        {
                            type: 16
                        }
                    ]
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist static props for elements with dynamic text children', function () {
        var _a = transformWithHoist("<div><div id=\"foo\">{{ hello }}</div></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([testUtils_1.createObjectMatcher({ id: 'foo' })]);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: [
                        "\"div\"",
                        { content: "_hoisted_1" },
                        { type: 5 },
                        testUtils_1.genFlagText(shared_1.PatchFlags.TEXT)
                    ]
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('hoist static props for elements with unhoistable children', function () {
        var _a = transformWithHoist("<div><div id=\"foo\"><Comp/></div></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([testUtils_1.createObjectMatcher({ id: 'foo' })]);
        expect(args[2]).toMatchObject([
            {
                type: 1,
                codegenNode: {
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: [
                        "\"div\"",
                        { content: "_hoisted_1" },
                        [{ type: 1, tag: "Comp" }]
                    ]
                }
            }
        ]);
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('should hoist v-if props/children if static', function () {
        var _a = transformWithHoist("<div><div v-if=\"ok\" id=\"foo\"><span/></div></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([
            testUtils_1.createObjectMatcher({
                key: "[0]",
                id: 'foo'
            }),
            {
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: ["\"span\""]
            }
        ]);
        expect(args[2][0].codegenNode).toMatchObject({
            type: 18,
            expressions: [
                { callee: runtimeHelpers_1.OPEN_BLOCK },
                {
                    type: 19,
                    consequent: {
                        callee: runtimeHelpers_1.CREATE_BLOCK,
                        arguments: [
                            "\"div\"",
                            { content: "_hoisted_1" },
                            [
                                {
                                    codegenNode: { content: "_hoisted_2" }
                                }
                            ]
                        ]
                    }
                }
            ]
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('should hoist v-for children if static', function () {
        var _a = transformWithHoist("<div><div v-for=\"i in list\" id=\"foo\"><span/></div></div>"), root = _a.root, args = _a.args;
        expect(root.hoists).toMatchObject([
            testUtils_1.createObjectMatcher({
                id: 'foo'
            }),
            {
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: ["\"span\""]
            }
        ]);
        var forBlockCodegen = args[2][0].codegenNode;
        expect(forBlockCodegen).toMatchObject({
            type: 18,
            expressions: [
                { callee: runtimeHelpers_1.OPEN_BLOCK },
                {
                    callee: runtimeHelpers_1.CREATE_BLOCK,
                    arguments: [
                        runtimeHelpers_1.FRAGMENT,
                        "null",
                        {
                            type: 13,
                            callee: runtimeHelpers_1.RENDER_LIST
                        },
                        testUtils_1.genFlagText(shared_1.PatchFlags.UNKEYED_FRAGMENT)
                    ]
                }
            ]
        });
        var innerBlockCodegen = forBlockCodegen.expressions[1].arguments[2].arguments[1].returns;
        expect(innerBlockCodegen).toMatchObject({
            type: 18,
            expressions: [
                { callee: runtimeHelpers_1.OPEN_BLOCK },
                {
                    callee: runtimeHelpers_1.CREATE_BLOCK,
                    arguments: [
                        "\"div\"",
                        { content: "_hoisted_1" },
                        [
                            {
                                codegenNode: { content: "_hoisted_2" }
                            }
                        ]
                    ]
                }
            ]
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    describe('prefixIdentifiers', function () {
        test('hoist nested static tree with static interpolation', function () {
            var _a = transformWithHoist("<div><span>foo {{ 1 }} {{ true }}</span></div>", {
                prefixIdentifiers: true
            }), root = _a.root, args = _a.args;
            expect(root.hoists).toMatchObject([
                {
                    type: 13,
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: [
                        "\"span\"",
                        "null",
                        [
                            {
                                type: 2,
                                content: "foo "
                            },
                            {
                                type: 5,
                                content: {
                                    content: "1",
                                    isStatic: false,
                                    isConstant: true
                                }
                            },
                            {
                                type: 2,
                                content: " "
                            },
                            {
                                type: 5,
                                content: {
                                    content: "true",
                                    isStatic: false,
                                    isConstant: true
                                }
                            }
                        ]
                    ]
                }
            ]);
            expect(args).toMatchObject([
                "\"div\"",
                "null",
                [
                    {
                        type: 1,
                        codegenNode: {
                            type: 4,
                            content: "_hoisted_1"
                        }
                    }
                ]
            ]);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('hoist nested static tree with static prop value', function () {
            var _a = transformWithHoist("<div><span :foo=\"0\">{{ 1 }}</span></div>", {
                prefixIdentifiers: true
            }), root = _a.root, args = _a.args;
            expect(root.hoists).toMatchObject([
                {
                    type: 13,
                    callee: runtimeHelpers_1.CREATE_VNODE,
                    arguments: [
                        "\"span\"",
                        testUtils_1.createObjectMatcher({ foo: "[0]" }),
                        {
                            type: 5,
                            content: {
                                content: "1",
                                isStatic: false,
                                isConstant: true
                            }
                        }
                    ]
                }
            ]);
            expect(args).toMatchObject([
                "\"div\"",
                "null",
                [
                    {
                        type: 1,
                        codegenNode: {
                            type: 4,
                            content: "_hoisted_1"
                        }
                    }
                ]
            ]);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('hoist class with static object value', function () {
            var _a = transformWithHoist("<div><span :class=\"{ foo: true }\">{{ bar }}</span></div>", {
                prefixIdentifiers: true
            }), root = _a.root, args = _a.args;
            expect(root.hoists).toMatchObject([
                {
                    type: 14,
                    properties: [
                        {
                            key: {
                                content: "class",
                                isConstant: true,
                                isStatic: true
                            },
                            value: {
                                content: "{ foo: true }",
                                isConstant: true,
                                isStatic: false
                            }
                        }
                    ]
                }
            ]);
            expect(args).toMatchObject([
                "\"div\"",
                "null",
                [
                    {
                        type: 1,
                        codegenNode: {
                            callee: runtimeHelpers_1.CREATE_VNODE,
                            arguments: [
                                "\"span\"",
                                {
                                    type: 4,
                                    content: "_hoisted_1"
                                },
                                {
                                    type: 5,
                                    content: {
                                        content: "_ctx.bar",
                                        isConstant: false,
                                        isStatic: false
                                    }
                                },
                                "1 /* TEXT */"
                            ]
                        }
                    }
                ]
            ]);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('should NOT hoist expressions that refer scope variables', function () {
            var root = transformWithHoist("<div><p v-for=\"o in list\"><span>{{ o }}</span></p></div>", {
                prefixIdentifiers: true
            }).root;
            expect(root.hoists.length).toBe(0);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('should NOT hoist expressions that refer scope variables (2)', function () {
            var root = transformWithHoist("<div><p v-for=\"o in list\"><span>{{ o + 'foo' }}</span></p></div>", {
                prefixIdentifiers: true
            }).root;
            expect(root.hoists.length).toBe(0);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('should NOT hoist expressions that refer scope variables (v-slot)', function () {
            var root = transformWithHoist("<Comp v-slot=\"{ foo }\">{{ foo }}</Comp>", {
                prefixIdentifiers: true
            }).root;
            expect(root.hoists.length).toBe(0);
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('should NOT hoist elements with cached handlers', function () {
            var root = transformWithHoist("<div><div><div @click=\"foo\"/></div></div>", {
                prefixIdentifiers: true,
                cacheHandlers: true
            }).root;
            expect(root.cached).toBe(1);
            expect(root.hoists.length).toBe(0);
            expect(src_1.generate(root, {
                mode: 'module',
                prefixIdentifiers: true
            }).code).toMatchSnapshot();
        });
    });
});
