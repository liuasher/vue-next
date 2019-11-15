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
var vSlot_1 = require("../../src/transforms/vSlot");
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var testUtils_1 = require("../testUtils");
var shared_1 = require("@vue/shared");
var vFor_1 = require("../../src/transforms/vFor");
var vIf_1 = require("../../src/transforms/vIf");
function parseWithSlots(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ nodeTransforms: __spreadArrays([
            vIf_1.transformIf,
            vFor_1.transformFor
        ], (options.prefixIdentifiers
            ? [vSlot_1.trackVForSlotScopes, transformExpression_1.transformExpression]
            : []), [
            transformElement_1.transformElement,
            vSlot_1.trackSlotScopes
        ]), directiveTransforms: {
            on: vOn_1.transformOn,
            bind: vBind_1.transformBind
        } }, options));
    return {
        root: ast,
        slots: ast.children[0].type === 1
            ? ast.children[0].codegenNode.arguments[2]
            : null
    };
}
function createSlotMatcher(obj) {
    return {
        type: 14,
        properties: Object.keys(obj)
            .map(function (key) {
            return {
                type: 15,
                key: {
                    type: 4,
                    isStatic: !/^\[/.test(key),
                    content: key.replace(/^\[|\]$/g, '')
                },
                value: obj[key]
            };
        })
            .concat({
            key: { content: "_compiled" },
            value: { content: "true" }
        })
    };
}
describe('compiler: transform component slots', function () {
    test('implicit default slot', function () {
        var _a = parseWithSlots("<Comp><div/></Comp>", {
            prefixIdentifiers: true
        }), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject(createSlotMatcher({
            default: {
                type: 17,
                params: undefined,
                returns: [
                    {
                        type: 1,
                        tag: "div"
                    }
                ]
            }
        }));
        expect(src_1.generate(root, { prefixIdentifiers: true }).code).toMatchSnapshot();
    });
    test('explicit default slot', function () {
        var _a = parseWithSlots("<Comp v-slot=\"{ foo }\">{{ foo }}{{ bar }}</Comp>", { prefixIdentifiers: true }), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject(createSlotMatcher({
            default: {
                type: 17,
                params: {
                    type: 8,
                    children: ["{ ", { content: "foo" }, " }"]
                },
                returns: [
                    {
                        type: 5,
                        content: {
                            content: "foo"
                        }
                    },
                    {
                        type: 5,
                        content: {
                            content: "_ctx.bar"
                        }
                    }
                ]
            }
        }));
        expect(src_1.generate(root, { prefixIdentifiers: true }).code).toMatchSnapshot();
    });
    test('named slots', function () {
        var _a = parseWithSlots("<Comp>\n        <template v-slot:one=\"{ foo }\">\n          {{ foo }}{{ bar }}\n        </template>\n        <template #two=\"{ bar }\">\n          {{ foo }}{{ bar }}\n        </template>\n      </Comp>", { prefixIdentifiers: true }), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject(createSlotMatcher({
            one: {
                type: 17,
                params: {
                    type: 8,
                    children: ["{ ", { content: "foo" }, " }"]
                },
                returns: [
                    {
                        type: 5,
                        content: {
                            content: "foo"
                        }
                    },
                    {
                        type: 5,
                        content: {
                            content: "_ctx.bar"
                        }
                    }
                ]
            },
            two: {
                type: 17,
                params: {
                    type: 8,
                    children: ["{ ", { content: "bar" }, " }"]
                },
                returns: [
                    {
                        type: 5,
                        content: {
                            content: "_ctx.foo"
                        }
                    },
                    {
                        type: 5,
                        content: {
                            content: "bar"
                        }
                    }
                ]
            }
        }));
        expect(src_1.generate(root, { prefixIdentifiers: true }).code).toMatchSnapshot();
    });
    test('dynamically named slots', function () {
        var _a = parseWithSlots("<Comp>\n        <template v-slot:[one]=\"{ foo }\">\n          {{ foo }}{{ bar }}\n        </template>\n        <template #[two]=\"{ bar }\">\n          {{ foo }}{{ bar }}\n        </template>\n      </Comp>", { prefixIdentifiers: true }), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject(createSlotMatcher({
            '[_ctx.one]': {
                type: 17,
                params: {
                    type: 8,
                    children: ["{ ", { content: "foo" }, " }"]
                },
                returns: [
                    {
                        type: 5,
                        content: {
                            content: "foo"
                        }
                    },
                    {
                        type: 5,
                        content: {
                            content: "_ctx.bar"
                        }
                    }
                ]
            },
            '[_ctx.two]': {
                type: 17,
                params: {
                    type: 8,
                    children: ["{ ", { content: "bar" }, " }"]
                },
                returns: [
                    {
                        type: 5,
                        content: {
                            content: "_ctx.foo"
                        }
                    },
                    {
                        type: 5,
                        content: {
                            content: "bar"
                        }
                    }
                ]
            }
        }));
        expect(src_1.generate(root, { prefixIdentifiers: true }).code).toMatchSnapshot();
    });
    test('nested slots scoping', function () {
        var _a = parseWithSlots("<Comp>\n        <template #default=\"{ foo }\">\n          <Inner v-slot=\"{ bar }\">\n            {{ foo }}{{ bar }}{{ baz }}\n          </Inner>\n          {{ foo }}{{ bar }}{{ baz }}\n        </template>\n      </Comp>", { prefixIdentifiers: true }), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject(createSlotMatcher({
            default: {
                type: 17,
                params: {
                    type: 8,
                    children: ["{ ", { content: "foo" }, " }"]
                },
                returns: [
                    {
                        type: 1,
                        codegenNode: {
                            type: 13,
                            arguments: [
                                "_component_Inner",
                                "null",
                                createSlotMatcher({
                                    default: {
                                        type: 17,
                                        params: {
                                            type: 8,
                                            children: ["{ ", { content: "bar" }, " }"]
                                        },
                                        returns: [
                                            {
                                                type: 5,
                                                content: {
                                                    content: "foo"
                                                }
                                            },
                                            {
                                                type: 5,
                                                content: {
                                                    content: "bar"
                                                }
                                            },
                                            {
                                                type: 5,
                                                content: {
                                                    content: "_ctx.baz"
                                                }
                                            }
                                        ]
                                    }
                                }),
                                testUtils_1.genFlagText(shared_1.PatchFlags.DYNAMIC_SLOTS)
                            ]
                        }
                    },
                    {
                        type: 2,
                        content: " "
                    },
                    {
                        type: 5,
                        content: {
                            content: "foo"
                        }
                    },
                    {
                        type: 5,
                        content: {
                            content: "_ctx.bar"
                        }
                    },
                    {
                        type: 5,
                        content: {
                            content: "_ctx.baz"
                        }
                    }
                ]
            }
        }));
        expect(src_1.generate(root, { prefixIdentifiers: true }).code).toMatchSnapshot();
    });
    test('should force dynamic when inside v-for', function () {
        var root = parseWithSlots("<div v-for=\"i in list\">\n        <Comp v-slot=\"bar\">foo</Comp>\n      </div>").root;
        var div = root.children[0].children[0]
            .codegenNode;
        var comp = div.arguments[2][0];
        expect(comp.codegenNode.arguments[3]).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.DYNAMIC_SLOTS));
    });
    test('should only force dynamic slots when actually using scope vars w/ prefixIdentifiers: true', function () {
        function assertDynamicSlots(template, shouldForce) {
            var root = parseWithSlots(template, { prefixIdentifiers: true }).root;
            var flag;
            if (root.children[0].type === 11) {
                var div = root.children[0].children[0]
                    .codegenNode;
                var comp = div.arguments[2][0];
                flag = comp.codegenNode.arguments[3];
            }
            else {
                var innerComp = root.children[0]
                    .children[0];
                flag = innerComp.codegenNode.arguments[3];
            }
            if (shouldForce) {
                expect(flag).toBe(testUtils_1.genFlagText(shared_1.PatchFlags.DYNAMIC_SLOTS));
            }
            else {
                expect(flag).toBeUndefined();
            }
        }
        assertDynamicSlots("<div v-for=\"i in list\">\n        <Comp v-slot=\"bar\">foo</Comp>\n      </div>", false);
        assertDynamicSlots("<div v-for=\"i in list\">\n        <Comp v-slot=\"bar\">{{ i }}</Comp>\n      </div>", true);
        assertDynamicSlots("<Comp v-slot=\"foo\">\n        <Comp v-slot=\"bar\">{{ bar }}</Comp>\n      </Comp>", false);
        assertDynamicSlots("<Comp v-slot=\"foo\">\n        <Comp v-slot=\"bar\">{{ foo }}</Comp>\n      </Comp>", true);
    });
    test('named slot with v-if', function () {
        var _a = parseWithSlots("<Comp>\n        <template #one v-if=\"ok\">hello</template>\n      </Comp>"), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.CREATE_SLOTS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    _compiled: "[true]"
                }),
                {
                    type: 16,
                    elements: [
                        {
                            type: 19,
                            test: { content: "ok" },
                            consequent: testUtils_1.createObjectMatcher({
                                name: "one",
                                fn: {
                                    type: 17,
                                    returns: [{ type: 2, content: "hello" }]
                                }
                            }),
                            alternate: {
                                content: "undefined",
                                isStatic: false
                            }
                        }
                    ]
                }
            ]
        });
        expect(root.children[0].codegenNode.arguments[3]).toMatch(shared_1.PatchFlags.DYNAMIC_SLOTS + '');
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('named slot with v-if + prefixIdentifiers: true', function () {
        var _a = parseWithSlots("<Comp>\n        <template #one=\"props\" v-if=\"ok\">{{ props }}</template>\n      </Comp>", { prefixIdentifiers: true }), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.CREATE_SLOTS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    _compiled: "[true]"
                }),
                {
                    type: 16,
                    elements: [
                        {
                            type: 19,
                            test: { content: "_ctx.ok" },
                            consequent: testUtils_1.createObjectMatcher({
                                name: "one",
                                fn: {
                                    type: 17,
                                    params: { content: "props" },
                                    returns: [
                                        {
                                            type: 5,
                                            content: { content: "props" }
                                        }
                                    ]
                                }
                            }),
                            alternate: {
                                content: "undefined",
                                isStatic: false
                            }
                        }
                    ]
                }
            ]
        });
        expect(root.children[0].codegenNode.arguments[3]).toMatch(shared_1.PatchFlags.DYNAMIC_SLOTS + '');
        expect(src_1.generate(root, { prefixIdentifiers: true }).code).toMatchSnapshot();
    });
    test('named slot with v-if + v-else-if + v-else', function () {
        var _a = parseWithSlots("<Comp>\n        <template #one v-if=\"ok\">foo</template>\n        <template #two=\"props\" v-else-if=\"orNot\">bar</template>\n        <template #one v-else>baz</template>\n      </Comp>"), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.CREATE_SLOTS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    _compiled: "[true]"
                }),
                {
                    type: 16,
                    elements: [
                        {
                            type: 19,
                            test: { content: "ok" },
                            consequent: testUtils_1.createObjectMatcher({
                                name: "one",
                                fn: {
                                    type: 17,
                                    params: undefined,
                                    returns: [{ type: 2, content: "foo" }]
                                }
                            }),
                            alternate: {
                                type: 19,
                                test: { content: "orNot" },
                                consequent: testUtils_1.createObjectMatcher({
                                    name: "two",
                                    fn: {
                                        type: 17,
                                        params: { content: "props" },
                                        returns: [{ type: 2, content: "bar" }]
                                    }
                                }),
                                alternate: testUtils_1.createObjectMatcher({
                                    name: "one",
                                    fn: {
                                        type: 17,
                                        params: undefined,
                                        returns: [{ type: 2, content: "baz" }]
                                    }
                                })
                            }
                        }
                    ]
                }
            ]
        });
        expect(root.children[0].codegenNode.arguments[3]).toMatch(shared_1.PatchFlags.DYNAMIC_SLOTS + '');
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('named slot with v-for w/ prefixIdentifiers: true', function () {
        var _a = parseWithSlots("<Comp>\n        <template v-for=\"name in list\" #[name]>{{ name }}</template>\n      </Comp>", { prefixIdentifiers: true }), root = _a.root, slots = _a.slots;
        expect(slots).toMatchObject({
            type: 13,
            callee: runtimeHelpers_1.CREATE_SLOTS,
            arguments: [
                testUtils_1.createObjectMatcher({
                    _compiled: "[true]"
                }),
                {
                    type: 16,
                    elements: [
                        {
                            type: 13,
                            callee: runtimeHelpers_1.RENDER_LIST,
                            arguments: [
                                { content: "_ctx.list" },
                                {
                                    type: 17,
                                    params: [{ content: "name" }],
                                    returns: testUtils_1.createObjectMatcher({
                                        name: "[name]",
                                        fn: {
                                            type: 17,
                                            returns: [
                                                {
                                                    type: 5,
                                                    content: { content: "name", isStatic: false }
                                                }
                                            ]
                                        }
                                    })
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        expect(root.children[0].codegenNode.arguments[3]).toMatch(shared_1.PatchFlags.DYNAMIC_SLOTS + '');
        expect(src_1.generate(root, { prefixIdentifiers: true }).code).toMatchSnapshot();
    });
    describe('errors', function () {
        test('error on extraneous children w/ named slots', function () {
            var onError = jest.fn();
            var source = "<Comp><template #default>foo</template>bar</Comp>";
            parseWithSlots(source, { onError: onError });
            var index = source.indexOf('bar');
            expect(onError.mock.calls[0][0]).toMatchObject({
                code: 45,
                loc: {
                    source: "bar",
                    start: {
                        offset: index,
                        line: 1,
                        column: index + 1
                    },
                    end: {
                        offset: index + 3,
                        line: 1,
                        column: index + 4
                    }
                }
            });
        });
        test('error on duplicated slot names', function () {
            var onError = jest.fn();
            var source = "<Comp><template #foo></template><template #foo></template></Comp>";
            parseWithSlots(source, { onError: onError });
            var index = source.lastIndexOf('#foo');
            expect(onError.mock.calls[0][0]).toMatchObject({
                code: 44,
                loc: {
                    source: "#foo",
                    start: {
                        offset: index,
                        line: 1,
                        column: index + 1
                    },
                    end: {
                        offset: index + 4,
                        line: 1,
                        column: index + 5
                    }
                }
            });
        });
        test('error on invalid mixed slot usage', function () {
            var onError = jest.fn();
            var source = "<Comp v-slot=\"foo\"><template #foo></template></Comp>";
            parseWithSlots(source, { onError: onError });
            var index = source.lastIndexOf('#foo');
            expect(onError.mock.calls[0][0]).toMatchObject({
                code: 43,
                loc: {
                    source: "#foo",
                    start: {
                        offset: index,
                        line: 1,
                        column: index + 1
                    },
                    end: {
                        offset: index + 4,
                        line: 1,
                        column: index + 5
                    }
                }
            });
        });
        test('error on v-slot usage on plain elements', function () {
            var onError = jest.fn();
            var source = "<div v-slot/>";
            parseWithSlots(source, { onError: onError });
            var index = source.indexOf('v-slot');
            expect(onError.mock.calls[0][0]).toMatchObject({
                code: 46,
                loc: {
                    source: "v-slot",
                    start: {
                        offset: index,
                        line: 1,
                        column: index + 1
                    },
                    end: {
                        offset: index + 6,
                        line: 1,
                        column: index + 7
                    }
                }
            });
        });
        test('error on named slot on component', function () {
            var onError = jest.fn();
            var source = "<Comp v-slot:foo>foo</Comp>";
            parseWithSlots(source, { onError: onError });
            var index = source.indexOf('v-slot');
            expect(onError.mock.calls[0][0]).toMatchObject({
                code: 42,
                loc: {
                    source: "v-slot:foo",
                    start: {
                        offset: index,
                        line: 1,
                        column: index + 1
                    },
                    end: {
                        offset: index + 10,
                        line: 1,
                        column: index + 11
                    }
                }
            });
        });
    });
});
