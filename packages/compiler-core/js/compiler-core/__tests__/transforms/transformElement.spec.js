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
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var ast_1 = require("../../src/ast");
var transformElement_1 = require("../../src/transforms/transformElement");
var transformStyle_1 = require("../../../compiler-dom/src/transforms/transformStyle");
var vOn_1 = require("../../src/transforms/vOn");
var vBind_1 = require("../../src/transforms/vBind");
var shared_1 = require("@vue/shared");
var testUtils_1 = require("../testUtils");
var transformText_1 = require("../../src/transforms/transformText");
function parseWithElementTransform(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse("<div>" + template + "</div>", options);
    src_1.transform(ast, __assign({ nodeTransforms: [transformElement_1.transformElement, transformText_1.transformText] }, options));
    var codegenNode = ast.children[0].children[0]
        .codegenNode;
    expect(codegenNode.type).toBe(13);
    return {
        root: ast,
        node: codegenNode
    };
}
function parseWithBind(template) {
    return parseWithElementTransform(template, {
        directiveTransforms: {
            bind: vBind_1.transformBind
        }
    });
}
describe('compiler: element transform', function () {
    test('import + resolve component', function () {
        var root = parseWithElementTransform("<Foo/>").root;
        expect(root.helpers).toContain(runtimeHelpers_1.RESOLVE_COMPONENT);
        expect(root.components).toContain("Foo");
    });
    test('static props', function () {
        var node = parseWithElementTransform("<div id=\"foo\" class=\"bar\" />").node;
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments).toMatchObject([
            "\"div\"",
            testUtils_1.createObjectMatcher({
                id: 'foo',
                class: 'bar'
            })
        ]);
    });
    test('props + children', function () {
        var node = parseWithElementTransform("<div id=\"foo\"><span/></div>").node;
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments).toMatchObject([
            "\"div\"",
            testUtils_1.createObjectMatcher({
                id: 'foo'
            }),
            [
                {
                    type: 1,
                    tag: 'span',
                    codegenNode: {
                        callee: runtimeHelpers_1.CREATE_VNODE,
                        arguments: ["\"span\""]
                    }
                }
            ]
        ]);
    });
    test('0 placeholder for children with no props', function () {
        var node = parseWithElementTransform("<div><span/></div>").node;
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments).toMatchObject([
            "\"div\"",
            "null",
            [
                {
                    type: 1,
                    tag: 'span',
                    codegenNode: {
                        callee: runtimeHelpers_1.CREATE_VNODE,
                        arguments: ["\"span\""]
                    }
                }
            ]
        ]);
    });
    test('v-bind="obj"', function () {
        var _a = parseWithElementTransform("<div v-bind=\"obj\" />"), root = _a.root, node = _a.node;
        expect(root.helpers).not.toContain(runtimeHelpers_1.MERGE_PROPS);
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments[1]).toMatchObject({
            type: 4,
            content: "obj"
        });
    });
    test('v-bind="obj" after static prop', function () {
        var _a = parseWithElementTransform("<div id=\"foo\" v-bind=\"obj\" />"), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.MERGE_PROPS);
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments[1]).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.MERGE_PROPS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    id: 'foo'
                }),
                {
                    type: 4,
                    content: "obj"
                }
            ]
        });
    });
    test('v-bind="obj" before static prop', function () {
        var _a = parseWithElementTransform("<div v-bind=\"obj\" id=\"foo\" />"), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.MERGE_PROPS);
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments[1]).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.MERGE_PROPS,
            arguments: [
                {
                    type: 4,
                    content: "obj"
                },
                testUtils_1.createObjectMatcher({
                    id: 'foo'
                })
            ]
        });
    });
    test('v-bind="obj" between static props', function () {
        var _a = parseWithElementTransform("<div id=\"foo\" v-bind=\"obj\" class=\"bar\" />"), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.MERGE_PROPS);
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments[1]).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.MERGE_PROPS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    id: 'foo'
                }),
                {
                    type: 4,
                    content: "obj"
                },
                testUtils_1.createObjectMatcher({
                    class: 'bar'
                })
            ]
        });
    });
    test('v-on="obj"', function () {
        var _a = parseWithElementTransform("<div id=\"foo\" v-on=\"obj\" class=\"bar\" />"), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.MERGE_PROPS);
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments[1]).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.MERGE_PROPS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    id: 'foo'
                }),
                {
                    type: 13,
                    callee: runtimeHelpers_1.TO_HANDLERS,
                    arguments: [
                        {
                            type: 4,
                            content: "obj"
                        }
                    ]
                },
                testUtils_1.createObjectMatcher({
                    class: 'bar'
                })
            ]
        });
    });
    test('v-on="obj" + v-bind="obj"', function () {
        var _a = parseWithElementTransform("<div id=\"foo\" v-on=\"handlers\" v-bind=\"obj\" />"), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.MERGE_PROPS);
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments[1]).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.MERGE_PROPS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    id: 'foo'
                }),
                {
                    type: 13,
                    callee: runtimeHelpers_1.TO_HANDLERS,
                    arguments: [
                        {
                            type: 4,
                            content: "handlers"
                        }
                    ]
                },
                {
                    type: 4,
                    content: "obj"
                }
            ]
        });
    });
    test('should handle plain <template> as normal element', function () {
        var node = parseWithElementTransform("<template id=\"foo\" />").node;
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments).toMatchObject([
            "\"template\"",
            testUtils_1.createObjectMatcher({
                id: 'foo'
            })
        ]);
    });
    test('should handle <portal> element', function () {
        var node = parseWithElementTransform("<portal target=\"#foo\"><span /></portal>").node;
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments).toMatchObject([
            runtimeHelpers_1.PORTAL,
            testUtils_1.createObjectMatcher({
                target: '#foo'
            }),
            [
                {
                    type: 1,
                    tag: 'span',
                    codegenNode: {
                        callee: runtimeHelpers_1.CREATE_VNODE,
                        arguments: ["\"span\""]
                    }
                }
            ]
        ]);
    });
    test('should handle <Portal> element', function () {
        var node = parseWithElementTransform("<Portal target=\"#foo\"><span /></Portal>").node;
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments).toMatchObject([
            runtimeHelpers_1.PORTAL,
            testUtils_1.createObjectMatcher({
                target: '#foo'
            }),
            [
                {
                    type: 1,
                    tag: 'span',
                    codegenNode: {
                        callee: runtimeHelpers_1.CREATE_VNODE,
                        arguments: ["\"span\""]
                    }
                }
            ]
        ]);
    });
    test('error on v-bind with no argument', function () {
        var onError = jest.fn();
        parseWithElementTransform("<div v-bind/>", { onError: onError });
        expect(onError.mock.calls[0]).toMatchObject([
            {
                code: 39
            }
        ]);
    });
    test('directiveTransforms', function () {
        var _dir;
        var node = parseWithElementTransform("<div v-foo:bar=\"hello\" />", {
            directiveTransforms: {
                foo: function (dir) {
                    _dir = dir;
                    return {
                        props: [ast_1.createObjectProperty(dir.arg, dir.exp)],
                        needRuntime: false
                    };
                }
            }
        }).node;
        expect(node.callee).toBe(runtimeHelpers_1.CREATE_VNODE);
        expect(node.arguments[1]).toMatchObject({
            type: 14,
            properties: [
                {
                    type: 15,
                    key: _dir.arg,
                    value: _dir.exp
                }
            ]
        });
        expect(node.arguments[3]).toMatch(shared_1.PatchFlags.PROPS + '');
        expect(node.arguments[4]).toMatch("\"bar\"");
    });
    test('directiveTransform with needRuntime: true', function () {
        var _a = parseWithElementTransform("<div v-foo:bar=\"hello\" />", {
            directiveTransforms: {
                foo: function () {
                    return {
                        props: [],
                        needRuntime: true
                    };
                }
            }
        }), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.RESOLVE_DIRECTIVE);
        expect(root.directives).toContain("foo");
        expect(node.callee).toBe(runtimeHelpers_1.WITH_DIRECTIVES);
        expect(node.arguments).toMatchObject([
            {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: [
                    "\"div\"",
                    "null",
                    "null",
                    testUtils_1.genFlagText(shared_1.PatchFlags.NEED_PATCH)
                ]
            },
            {
                type: 16,
                elements: [
                    {
                        type: 16,
                        elements: [
                            "_directive_foo",
                            {
                                type: 4,
                                content: "hello",
                                isStatic: false
                            },
                            {
                                type: 4,
                                content: "bar",
                                isStatic: true
                            }
                        ]
                    }
                ]
            }
        ]);
    });
    test('directiveTransform with needRuntime: Symbol', function () {
        var _a = parseWithElementTransform("<div v-foo:bar=\"hello\" />", {
            directiveTransforms: {
                foo: function () {
                    return {
                        props: [],
                        needRuntime: runtimeHelpers_1.CREATE_VNODE
                    };
                }
            }
        }), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.CREATE_VNODE);
        expect(root.helpers).not.toContain(runtimeHelpers_1.RESOLVE_DIRECTIVE);
        expect(root.directives.length).toBe(0);
        expect(node.arguments[1].elements[0].elements[0]).toBe("_" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE]);
    });
    test('runtime directives', function () {
        var _a = parseWithElementTransform("<div v-foo v-bar=\"x\" v-baz:[arg].mod.mad=\"y\" />"), root = _a.root, node = _a.node;
        expect(root.helpers).toContain(runtimeHelpers_1.RESOLVE_DIRECTIVE);
        expect(root.directives).toContain("foo");
        expect(root.directives).toContain("bar");
        expect(root.directives).toContain("baz");
        expect(node.callee).toBe(runtimeHelpers_1.WITH_DIRECTIVES);
        expect(node.arguments).toMatchObject([
            {
                type: 13
            },
            {
                type: 16,
                elements: [
                    {
                        type: 16,
                        elements: ["_directive_foo"]
                    },
                    {
                        type: 16,
                        elements: [
                            "_directive_bar",
                            {
                                type: 4,
                                content: "x"
                            }
                        ]
                    },
                    {
                        type: 16,
                        elements: [
                            "_directive_baz",
                            {
                                type: 4,
                                content: "y",
                                isStatic: false
                            },
                            {
                                type: 4,
                                content: "arg",
                                isStatic: false
                            },
                            {
                                type: 14,
                                properties: [
                                    {
                                        type: 15,
                                        key: {
                                            type: 4,
                                            content: "mod",
                                            isStatic: true
                                        },
                                        value: {
                                            type: 4,
                                            content: "true",
                                            isStatic: false
                                        }
                                    },
                                    {
                                        type: 15,
                                        key: {
                                            type: 4,
                                            content: "mad",
                                            isStatic: true
                                        },
                                        value: {
                                            type: 4,
                                            content: "true",
                                            isStatic: false
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]);
    });
    test("props merging: event handlers", function () {
        var node = parseWithElementTransform("<div @click.foo=\"a\" @click.bar=\"b\" />", {
            directiveTransforms: {
                on: vOn_1.transformOn
            }
        }).node;
        expect(node.arguments[1]).toMatchObject({
            type: 14,
            properties: [
                {
                    type: 15,
                    key: {
                        type: 4,
                        content: "onClick",
                        isStatic: true
                    },
                    value: {
                        type: 16,
                        elements: [
                            {
                                type: 4,
                                content: "a",
                                isStatic: false
                            },
                            {
                                type: 4,
                                content: "b",
                                isStatic: false
                            }
                        ]
                    }
                }
            ]
        });
    });
    test("props merging: style", function () {
        var node = parseWithElementTransform("<div style=\"color: red\" :style=\"{ color: 'red' }\" />", {
            nodeTransforms: [transformStyle_1.transformStyle, transformElement_1.transformElement],
            directiveTransforms: {
                bind: vBind_1.transformBind
            }
        }).node;
        expect(node.arguments[1]).toMatchObject({
            type: 14,
            properties: [
                {
                    type: 15,
                    key: {
                        type: 4,
                        content: "style",
                        isStatic: true
                    },
                    value: {
                        type: 16,
                        elements: [
                            {
                                type: 4,
                                content: "_hoisted_1",
                                isStatic: false
                            },
                            {
                                type: 4,
                                content: "{ color: 'red' }",
                                isStatic: false
                            }
                        ]
                    }
                }
            ]
        });
    });
    test("props merging: class", function () {
        var node = parseWithElementTransform("<div class=\"foo\" :class=\"{ bar: isBar }\" />", {
            directiveTransforms: {
                bind: vBind_1.transformBind
            }
        }).node;
        expect(node.arguments[1]).toMatchObject({
            type: 14,
            properties: [
                {
                    type: 15,
                    key: {
                        type: 4,
                        content: "class",
                        isStatic: true
                    },
                    value: {
                        type: 16,
                        elements: [
                            {
                                type: 4,
                                content: "foo",
                                isStatic: true
                            },
                            {
                                type: 4,
                                content: "{ bar: isBar }",
                                isStatic: false
                            }
                        ]
                    }
                }
            ]
        });
    });
    describe('patchFlag analysis', function () {
        test('TEXT', function () {
            var node = parseWithBind("<div>foo</div>").node;
            expect(node.arguments.length).toBe(3);
            var node2 = parseWithBind("<div>{{ foo }}</div>").node;
            expect(node2.arguments.length).toBe(4);
            expect(node2.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.TEXT));
            var node3 = parseWithBind("<div>foo {{ bar }} baz</div>").node;
            expect(node3.arguments.length).toBe(4);
            expect(node3.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.TEXT));
        });
        test('CLASS', function () {
            var node = parseWithBind("<div :class=\"foo\" />").node;
            expect(node.arguments.length).toBe(4);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.CLASS));
        });
        test('STYLE', function () {
            var node = parseWithBind("<div :style=\"foo\" />").node;
            expect(node.arguments.length).toBe(4);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.STYLE));
        });
        test('PROPS', function () {
            var node = parseWithBind("<div id=\"foo\" :foo=\"bar\" :baz=\"qux\" />").node;
            expect(node.arguments.length).toBe(5);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.PROPS));
            expect(node.arguments[4]).toBe("[\"foo\", \"baz\"]");
        });
        test('CLASS + STYLE + PROPS', function () {
            var node = parseWithBind("<div id=\"foo\" :class=\"cls\" :style=\"styl\" :foo=\"bar\" :baz=\"qux\"/>").node;
            expect(node.arguments.length).toBe(5);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText([shared_1.PatchFlags.CLASS, shared_1.PatchFlags.STYLE, shared_1.PatchFlags.PROPS]));
            expect(node.arguments[4]).toBe("[\"foo\", \"baz\"]");
        });
        test('FULL_PROPS (v-bind)', function () {
            var node = parseWithBind("<div v-bind=\"foo\" />").node;
            expect(node.arguments.length).toBe(4);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.FULL_PROPS));
        });
        test('FULL_PROPS (dynamic key)', function () {
            var node = parseWithBind("<div :[foo]=\"bar\" />").node;
            expect(node.arguments.length).toBe(4);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.FULL_PROPS));
        });
        test('FULL_PROPS (w/ others)', function () {
            var node = parseWithBind("<div id=\"foo\" v-bind=\"bar\" :class=\"cls\" />").node;
            expect(node.arguments.length).toBe(4);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.FULL_PROPS));
        });
        test('NEED_PATCH (static ref)', function () {
            var node = parseWithBind("<div ref=\"foo\" />").node;
            expect(node.arguments.length).toBe(4);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.NEED_PATCH));
        });
        test('NEED_PATCH (dynamic ref)', function () {
            var node = parseWithBind("<div :ref=\"foo\" />").node;
            expect(node.arguments.length).toBe(4);
            expect(node.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.NEED_PATCH));
        });
        test('NEED_PATCH (custom directives)', function () {
            var node = parseWithBind("<div v-foo />").node;
            var vnodeCall = node.arguments[0];
            expect(vnodeCall.arguments.length).toBe(4);
            expect(vnodeCall.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.NEED_PATCH));
        });
    });
    describe('dynamic component', function () {
        test('static binding', function () {
            var _a = parseWithBind("<component is=\"foo\" />"), node = _a.node, root = _a.root;
            expect(root.helpers).not.toContain(runtimeHelpers_1.RESOLVE_DYNAMIC_COMPONENT);
            expect(node).toMatchObject({
                callee: runtimeHelpers_1.CREATE_VNODE,
                arguments: ['_component_foo']
            });
        });
        test('dynamic binding', function () {
            var _a = parseWithBind("<component :is=\"foo\" />"), node = _a.node, root = _a.root;
            expect(root.helpers).toContain(runtimeHelpers_1.RESOLVE_DYNAMIC_COMPONENT);
            expect(node.arguments).toMatchObject([
                {
                    callee: runtimeHelpers_1.RESOLVE_DYNAMIC_COMPONENT,
                    arguments: [
                        {
                            type: 4,
                            content: 'foo'
                        }
                    ]
                }
            ]);
        });
    });
});
