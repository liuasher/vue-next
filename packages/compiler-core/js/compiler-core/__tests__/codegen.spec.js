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
var src_1 = require("../src");
var runtimeHelpers_1 = require("../src/runtimeHelpers");
var testUtils_1 = require("./testUtils");
var shared_1 = require("@vue/shared");
function createRoot(options) {
    if (options === void 0) { options = {}; }
    return __assign({ type: 0, children: [], helpers: [], components: [], directives: [], hoists: [], cached: 0, codegenNode: src_1.createSimpleExpression("null", false), loc: src_1.locStub }, options);
}
describe('compiler: codegen', function () {
    test('module mode preamble', function () {
        var root = createRoot({
            helpers: [runtimeHelpers_1.CREATE_VNODE, runtimeHelpers_1.RESOLVE_DIRECTIVE]
        });
        var code = src_1.generate(root, { mode: 'module' }).code;
        expect(code).toMatch("import { " + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + ", " + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_DIRECTIVE] + " } from \"vue\"");
        expect(code).toMatchSnapshot();
    });
    test('function mode preamble', function () {
        var root = createRoot({
            helpers: [runtimeHelpers_1.CREATE_VNODE, runtimeHelpers_1.RESOLVE_DIRECTIVE]
        });
        var code = src_1.generate(root, { mode: 'function' }).code;
        expect(code).toMatch("const _Vue = Vue");
        expect(code).toMatch("const { " + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + ": _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + ", " + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_DIRECTIVE] + ": _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_DIRECTIVE] + " } = _Vue");
        expect(code).toMatchSnapshot();
    });
    test('function mode preamble w/ prefixIdentifiers: true', function () {
        var root = createRoot({
            helpers: [runtimeHelpers_1.CREATE_VNODE, runtimeHelpers_1.RESOLVE_DIRECTIVE]
        });
        var code = src_1.generate(root, {
            mode: 'function',
            prefixIdentifiers: true
        }).code;
        expect(code).not.toMatch("const _Vue = Vue");
        expect(code).toMatch("const { " + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + ", " + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_DIRECTIVE] + " } = Vue");
        expect(code).toMatchSnapshot();
    });
    test('assets', function () {
        var root = createRoot({
            components: ["Foo", "bar-baz", "barbaz"],
            directives: ["my_dir"]
        });
        var code = src_1.generate(root, { mode: 'function' }).code;
        expect(code).toMatch("const _component_Foo = _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_COMPONENT] + "(\"Foo\")\n");
        expect(code).toMatch("const _component_bar_baz = _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_COMPONENT] + "(\"bar-baz\")\n");
        expect(code).toMatch("const _component_barbaz = _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_COMPONENT] + "(\"barbaz\")\n");
        expect(code).toMatch("const _directive_my_dir = _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.RESOLVE_DIRECTIVE] + "(\"my_dir\")\n");
        expect(code).toMatchSnapshot();
    });
    test('hoists', function () {
        var root = createRoot({
            hoists: [
                src_1.createSimpleExpression("hello", false, src_1.locStub),
                src_1.createObjectExpression([
                    src_1.createObjectProperty(src_1.createSimpleExpression("id", true, src_1.locStub), src_1.createSimpleExpression("foo", true, src_1.locStub))
                ], src_1.locStub)
            ]
        });
        var code = src_1.generate(root).code;
        expect(code).toMatch("const _hoisted_1 = hello");
        expect(code).toMatch("const _hoisted_2 = { id: \"foo\" }");
        expect(code).toMatchSnapshot();
    });
    test('prefixIdentifiers: true should inject _ctx statement', function () {
        var code = src_1.generate(createRoot(), { prefixIdentifiers: true }).code;
        expect(code).toMatch("const _ctx = this\n");
        expect(code).toMatchSnapshot();
    });
    test('static text', function () {
        var code = src_1.generate(createRoot({
            codegenNode: {
                type: 2,
                content: 'hello',
                loc: src_1.locStub
            }
        })).code;
        expect(code).toMatch("return \"hello\"");
        expect(code).toMatchSnapshot();
    });
    test('interpolation', function () {
        var code = src_1.generate(createRoot({
            codegenNode: src_1.createInterpolation("hello", src_1.locStub)
        })).code;
        expect(code).toMatch("return _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.TO_STRING] + "(hello)");
        expect(code).toMatchSnapshot();
    });
    test('comment', function () {
        var code = src_1.generate(createRoot({
            codegenNode: {
                type: 3,
                content: 'foo',
                loc: src_1.locStub
            }
        })).code;
        expect(code).toMatch("return _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_COMMENT] + "(\"foo\")");
        expect(code).toMatchSnapshot();
    });
    test('compound expression', function () {
        var code = src_1.generate(createRoot({
            codegenNode: src_1.createCompoundExpression([
                "_ctx.",
                src_1.createSimpleExpression("foo", false, src_1.locStub),
                " + ",
                {
                    type: 5,
                    loc: src_1.locStub,
                    content: src_1.createSimpleExpression("bar", false, src_1.locStub)
                }
            ])
        })).code;
        expect(code).toMatch("return _ctx.foo + _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.TO_STRING] + "(bar)");
        expect(code).toMatchSnapshot();
    });
    test('ifNode', function () {
        var code = src_1.generate(createRoot({
            codegenNode: {
                type: 9,
                loc: src_1.locStub,
                branches: [],
                codegenNode: src_1.createSequenceExpression([
                    src_1.createSimpleExpression('foo', false),
                    src_1.createSimpleExpression('bar', false)
                ])
            }
        })).code;
        expect(code).toMatch("return (foo, bar)");
        expect(code).toMatchSnapshot();
    });
    test('forNode', function () {
        var code = src_1.generate(createRoot({
            codegenNode: {
                type: 11,
                loc: src_1.locStub,
                source: src_1.createSimpleExpression('foo', false),
                valueAlias: undefined,
                keyAlias: undefined,
                objectIndexAlias: undefined,
                children: [],
                codegenNode: src_1.createSequenceExpression([
                    src_1.createSimpleExpression('foo', false),
                    src_1.createSimpleExpression('bar', false)
                ])
            }
        })).code;
        expect(code).toMatch("return (foo, bar)");
        expect(code).toMatchSnapshot();
    });
    test('Element (callExpression + objectExpression + TemplateChildNode[])', function () {
        var code = src_1.generate(createRoot({
            codegenNode: testUtils_1.createElementWithCodegen([
                "\"div\"",
                src_1.createObjectExpression([
                    src_1.createObjectProperty(src_1.createSimpleExpression("id", true, src_1.locStub), src_1.createSimpleExpression("foo", true, src_1.locStub)),
                    src_1.createObjectProperty(src_1.createSimpleExpression("prop", false, src_1.locStub), src_1.createSimpleExpression("bar", false, src_1.locStub)),
                    src_1.createObjectProperty({
                        type: 8,
                        loc: src_1.locStub,
                        children: [
                            "foo + ",
                            src_1.createSimpleExpression("bar", false, src_1.locStub)
                        ]
                    }, src_1.createSimpleExpression("bar", false, src_1.locStub))
                ], src_1.locStub),
                [
                    testUtils_1.createElementWithCodegen([
                        "\"p\"",
                        src_1.createObjectExpression([
                            src_1.createObjectProperty(src_1.createSimpleExpression("some-key", true, src_1.locStub), src_1.createSimpleExpression("foo", true, src_1.locStub))
                        ], src_1.locStub)
                    ])
                ],
                shared_1.PatchFlags.FULL_PROPS + ''
            ])
        })).code;
        expect(code).toMatch("\n    return _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + "(\"div\", {\n      id: \"foo\",\n      [prop]: bar,\n      [foo + bar]: bar\n    }, [\n      _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + "(\"p\", { \"some-key\": \"foo\" })\n    ], " + shared_1.PatchFlags.FULL_PROPS + ")");
        expect(code).toMatchSnapshot();
    });
    test('ArrayExpression', function () {
        var code = src_1.generate(createRoot({
            codegenNode: src_1.createArrayExpression([
                src_1.createSimpleExpression("foo", false),
                src_1.createCallExpression("bar", ["baz"])
            ])
        })).code;
        expect(code).toMatch("return [\n      foo,\n      bar(baz)\n    ]");
        expect(code).toMatchSnapshot();
    });
    test('SequenceExpression', function () {
        var code = src_1.generate(createRoot({
            codegenNode: src_1.createSequenceExpression([
                src_1.createSimpleExpression("foo", false),
                src_1.createCallExpression("bar", ["baz"])
            ])
        })).code;
        expect(code).toMatch("return (foo, bar(baz))");
        expect(code).toMatchSnapshot();
    });
    test('ConditionalExpression', function () {
        var code = src_1.generate(createRoot({
            codegenNode: src_1.createConditionalExpression(src_1.createSimpleExpression("ok", false), src_1.createCallExpression("foo"), src_1.createConditionalExpression(src_1.createSimpleExpression("orNot", false), src_1.createCallExpression("bar"), src_1.createCallExpression("baz")))
        })).code;
        expect(code).toMatch("return ok\n      ? foo()\n      : orNot\n        ? bar()\n        : baz()");
        expect(code).toMatchSnapshot();
    });
    test('CacheExpression', function () {
        var code = src_1.generate(createRoot({
            cached: 1,
            codegenNode: src_1.createCacheExpression(1, src_1.createSimpleExpression("foo", false))
        }), {
            mode: 'module',
            prefixIdentifiers: true
        }).code;
        expect(code).toMatch("const _cache = _ctx.$cache");
        expect(code).toMatch("_cache[1] || (_cache[1] = foo)");
        expect(code).toMatchSnapshot();
    });
    test('CacheExpression w/ isVNode: true', function () {
        var code = src_1.generate(createRoot({
            cached: 1,
            codegenNode: src_1.createCacheExpression(1, src_1.createSimpleExpression("foo", false), true)
        }), {
            mode: 'module',
            prefixIdentifiers: true
        }).code;
        expect(code).toMatch("const _cache = _ctx.$cache");
        expect(code).toMatch("\n  _cache[1] || (\n    setBlockTracking(-1),\n    _cache[1] = foo,\n    setBlockTracking(1),\n    _cache[1]\n  )\n    ".trim());
        expect(code).toMatchSnapshot();
    });
});
