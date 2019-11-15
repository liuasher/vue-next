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
var parse_1 = require("../../src/parse");
var transform_1 = require("../../src/transform");
var vIf_1 = require("../../src/transforms/vIf");
var vFor_1 = require("../../src/transforms/vFor");
var vBind_1 = require("../../src/transforms/vBind");
var transformElement_1 = require("../../src/transforms/transformElement");
var transformSlotOutlet_1 = require("../../src/transforms/transformSlotOutlet");
var transformExpression_1 = require("../../src/transforms/transformExpression");
var src_1 = require("../../src");
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var runtime_dom_1 = require("@vue/runtime-dom");
var testUtils_1 = require("../testUtils");
function parseWithForTransform(template, options) {
    if (options === void 0) { options = {}; }
    var ast = parse_1.parse(template, options);
    transform_1.transform(ast, __assign({ nodeTransforms: __spreadArrays([
            vIf_1.transformIf,
            vFor_1.transformFor
        ], (options.prefixIdentifiers ? [transformExpression_1.transformExpression] : []), [
            transformSlotOutlet_1.transformSlotOutlet,
            transformElement_1.transformElement
        ]), directiveTransforms: {
            bind: vBind_1.transformBind
        } }, options));
    return {
        root: ast,
        node: ast.children[0]
    };
}
describe('compiler: v-for', function () {
    describe('transform', function () {
        test('number expression', function () {
            var forNode = parseWithForTransform('<span v-for="index in 5" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).toBeUndefined();
            expect(forNode.valueAlias.content).toBe('index');
            expect(forNode.source.content).toBe('5');
        });
        test('value', function () {
            var forNode = parseWithForTransform('<span v-for="(item) in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).toBeUndefined();
            expect(forNode.valueAlias.content).toBe('item');
            expect(forNode.source.content).toBe('items');
        });
        test('object de-structured value', function () {
            var forNode = parseWithForTransform('<span v-for="({ id, value }) in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).toBeUndefined();
            expect(forNode.valueAlias.content).toBe('{ id, value }');
            expect(forNode.source.content).toBe('items');
        });
        test('array de-structured value', function () {
            var forNode = parseWithForTransform('<span v-for="([ id, value ]) in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).toBeUndefined();
            expect(forNode.valueAlias.content).toBe('[ id, value ]');
            expect(forNode.source.content).toBe('items');
        });
        test('value and key', function () {
            var forNode = parseWithForTransform('<span v-for="(item, key) in items" />').node;
            expect(forNode.keyAlias).not.toBeUndefined();
            expect(forNode.keyAlias.content).toBe('key');
            expect(forNode.objectIndexAlias).toBeUndefined();
            expect(forNode.valueAlias.content).toBe('item');
            expect(forNode.source.content).toBe('items');
        });
        test('value, key and index', function () {
            var forNode = parseWithForTransform('<span v-for="(value, key, index) in items" />').node;
            expect(forNode.keyAlias).not.toBeUndefined();
            expect(forNode.keyAlias.content).toBe('key');
            expect(forNode.objectIndexAlias).not.toBeUndefined();
            expect(forNode.objectIndexAlias.content).toBe('index');
            expect(forNode.valueAlias.content).toBe('value');
            expect(forNode.source.content).toBe('items');
        });
        test('skipped key', function () {
            var forNode = parseWithForTransform('<span v-for="(value,,index) in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).not.toBeUndefined();
            expect(forNode.objectIndexAlias.content).toBe('index');
            expect(forNode.valueAlias.content).toBe('value');
            expect(forNode.source.content).toBe('items');
        });
        test('skipped value and key', function () {
            var forNode = parseWithForTransform('<span v-for="(,,index) in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).not.toBeUndefined();
            expect(forNode.objectIndexAlias.content).toBe('index');
            expect(forNode.valueAlias).toBeUndefined();
            expect(forNode.source.content).toBe('items');
        });
        test('unbracketed value', function () {
            var forNode = parseWithForTransform('<span v-for="item in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).toBeUndefined();
            expect(forNode.valueAlias.content).toBe('item');
            expect(forNode.source.content).toBe('items');
        });
        test('unbracketed value and key', function () {
            var forNode = parseWithForTransform('<span v-for="item, key in items" />').node;
            expect(forNode.keyAlias).not.toBeUndefined();
            expect(forNode.keyAlias.content).toBe('key');
            expect(forNode.objectIndexAlias).toBeUndefined();
            expect(forNode.valueAlias.content).toBe('item');
            expect(forNode.source.content).toBe('items');
        });
        test('unbracketed value, key and index', function () {
            var forNode = parseWithForTransform('<span v-for="value, key, index in items" />').node;
            expect(forNode.keyAlias).not.toBeUndefined();
            expect(forNode.keyAlias.content).toBe('key');
            expect(forNode.objectIndexAlias).not.toBeUndefined();
            expect(forNode.objectIndexAlias.content).toBe('index');
            expect(forNode.valueAlias.content).toBe('value');
            expect(forNode.source.content).toBe('items');
        });
        test('unbracketed skipped key', function () {
            var forNode = parseWithForTransform('<span v-for="value, , index in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).not.toBeUndefined();
            expect(forNode.objectIndexAlias.content).toBe('index');
            expect(forNode.valueAlias.content).toBe('value');
            expect(forNode.source.content).toBe('items');
        });
        test('unbracketed skipped value and key', function () {
            var forNode = parseWithForTransform('<span v-for=", , index in items" />').node;
            expect(forNode.keyAlias).toBeUndefined();
            expect(forNode.objectIndexAlias).not.toBeUndefined();
            expect(forNode.objectIndexAlias.content).toBe('index');
            expect(forNode.valueAlias).toBeUndefined();
            expect(forNode.source.content).toBe('items');
        });
    });
    describe('errors', function () {
        test('missing expression', function () {
            var onError = jest.fn();
            parseWithForTransform('<span v-for />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 37
            }));
        });
        test('empty expression', function () {
            var onError = jest.fn();
            parseWithForTransform('<span v-for="" />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 38
            }));
        });
        test('invalid expression', function () {
            var onError = jest.fn();
            parseWithForTransform('<span v-for="items" />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 38
            }));
        });
        test('missing source', function () {
            var onError = jest.fn();
            parseWithForTransform('<span v-for="item in" />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 38
            }));
        });
        test('missing value', function () {
            var onError = jest.fn();
            parseWithForTransform('<span v-for="in items" />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 38
            }));
        });
    });
    describe('source location', function () {
        test('value & source', function () {
            var source = '<span v-for="item in items" />';
            var forNode = parseWithForTransform(source).node;
            var itemOffset = source.indexOf('item');
            var value = forNode.valueAlias;
            expect(forNode.valueAlias.content).toBe('item');
            expect(value.loc.start.offset).toBe(itemOffset);
            expect(value.loc.start.line).toBe(1);
            expect(value.loc.start.column).toBe(itemOffset + 1);
            expect(value.loc.end.line).toBe(1);
            expect(value.loc.end.column).toBe(itemOffset + 1 + "item".length);
            var itemsOffset = source.indexOf('items');
            expect(forNode.source.content).toBe('items');
            expect(forNode.source.loc.start.offset).toBe(itemsOffset);
            expect(forNode.source.loc.start.line).toBe(1);
            expect(forNode.source.loc.start.column).toBe(itemsOffset + 1);
            expect(forNode.source.loc.end.line).toBe(1);
            expect(forNode.source.loc.end.column).toBe(itemsOffset + 1 + "items".length);
        });
        test('bracketed value', function () {
            var source = '<span v-for="( item ) in items" />';
            var forNode = parseWithForTransform(source).node;
            var itemOffset = source.indexOf('item');
            var value = forNode.valueAlias;
            expect(value.content).toBe('item');
            expect(value.loc.start.offset).toBe(itemOffset);
            expect(value.loc.start.line).toBe(1);
            expect(value.loc.start.column).toBe(itemOffset + 1);
            expect(value.loc.end.line).toBe(1);
            expect(value.loc.end.column).toBe(itemOffset + 1 + "item".length);
            var itemsOffset = source.indexOf('items');
            expect(forNode.source.content).toBe('items');
            expect(forNode.source.loc.start.offset).toBe(itemsOffset);
            expect(forNode.source.loc.start.line).toBe(1);
            expect(forNode.source.loc.start.column).toBe(itemsOffset + 1);
            expect(forNode.source.loc.end.line).toBe(1);
            expect(forNode.source.loc.end.column).toBe(itemsOffset + 1 + "items".length);
        });
        test('de-structured value', function () {
            var source = '<span v-for="(  { id, key }) in items" />';
            var forNode = parseWithForTransform(source).node;
            var value = forNode.valueAlias;
            var valueIndex = source.indexOf('{ id, key }');
            expect(value.content).toBe('{ id, key }');
            expect(value.loc.start.offset).toBe(valueIndex);
            expect(value.loc.start.line).toBe(1);
            expect(value.loc.start.column).toBe(valueIndex + 1);
            expect(value.loc.end.line).toBe(1);
            expect(value.loc.end.column).toBe(valueIndex + 1 + '{ id, key }'.length);
            var itemsOffset = source.indexOf('items');
            expect(forNode.source.content).toBe('items');
            expect(forNode.source.loc.start.offset).toBe(itemsOffset);
            expect(forNode.source.loc.start.line).toBe(1);
            expect(forNode.source.loc.start.column).toBe(itemsOffset + 1);
            expect(forNode.source.loc.end.line).toBe(1);
            expect(forNode.source.loc.end.column).toBe(itemsOffset + 1 + "items".length);
        });
        test('bracketed value, key, index', function () {
            var source = '<span v-for="( item, key, index ) in items" />';
            var forNode = parseWithForTransform(source).node;
            var itemOffset = source.indexOf('item');
            var value = forNode.valueAlias;
            expect(value.content).toBe('item');
            expect(value.loc.start.offset).toBe(itemOffset);
            expect(value.loc.start.line).toBe(1);
            expect(value.loc.start.column).toBe(itemOffset + 1);
            expect(value.loc.end.line).toBe(1);
            expect(value.loc.end.column).toBe(itemOffset + 1 + "item".length);
            var keyOffset = source.indexOf('key');
            var key = forNode.keyAlias;
            expect(key.content).toBe('key');
            expect(key.loc.start.offset).toBe(keyOffset);
            expect(key.loc.start.line).toBe(1);
            expect(key.loc.start.column).toBe(keyOffset + 1);
            expect(key.loc.end.line).toBe(1);
            expect(key.loc.end.column).toBe(keyOffset + 1 + "key".length);
            var indexOffset = source.indexOf('index');
            var index = forNode.objectIndexAlias;
            expect(index.content).toBe('index');
            expect(index.loc.start.offset).toBe(indexOffset);
            expect(index.loc.start.line).toBe(1);
            expect(index.loc.start.column).toBe(indexOffset + 1);
            expect(index.loc.end.line).toBe(1);
            expect(index.loc.end.column).toBe(indexOffset + 1 + "index".length);
            var itemsOffset = source.indexOf('items');
            expect(forNode.source.content).toBe('items');
            expect(forNode.source.loc.start.offset).toBe(itemsOffset);
            expect(forNode.source.loc.start.line).toBe(1);
            expect(forNode.source.loc.start.column).toBe(itemsOffset + 1);
            expect(forNode.source.loc.end.line).toBe(1);
            expect(forNode.source.loc.end.column).toBe(itemsOffset + 1 + "items".length);
        });
        test('skipped key', function () {
            var source = '<span v-for="( item,, index ) in items" />';
            var forNode = parseWithForTransform(source).node;
            var itemOffset = source.indexOf('item');
            var value = forNode.valueAlias;
            expect(value.content).toBe('item');
            expect(value.loc.start.offset).toBe(itemOffset);
            expect(value.loc.start.line).toBe(1);
            expect(value.loc.start.column).toBe(itemOffset + 1);
            expect(value.loc.end.line).toBe(1);
            expect(value.loc.end.column).toBe(itemOffset + 1 + "item".length);
            var indexOffset = source.indexOf('index');
            var index = forNode.objectIndexAlias;
            expect(index.content).toBe('index');
            expect(index.loc.start.offset).toBe(indexOffset);
            expect(index.loc.start.line).toBe(1);
            expect(index.loc.start.column).toBe(indexOffset + 1);
            expect(index.loc.end.line).toBe(1);
            expect(index.loc.end.column).toBe(indexOffset + 1 + "index".length);
            var itemsOffset = source.indexOf('items');
            expect(forNode.source.content).toBe('items');
            expect(forNode.source.loc.start.offset).toBe(itemsOffset);
            expect(forNode.source.loc.start.line).toBe(1);
            expect(forNode.source.loc.start.column).toBe(itemsOffset + 1);
            expect(forNode.source.loc.end.line).toBe(1);
            expect(forNode.source.loc.end.column).toBe(itemsOffset + 1 + "items".length);
        });
    });
    describe('prefixIdentifiers: true', function () {
        test('should prefix v-for source', function () {
            var node = parseWithForTransform("<div v-for=\"i in list\"/>", {
                prefixIdentifiers: true
            }).node;
            expect(node.source).toMatchObject({
                type: 4,
                content: "_ctx.list"
            });
        });
        test('should prefix v-for source w/ complex expression', function () {
            var node = parseWithForTransform("<div v-for=\"i in list.concat([foo])\"/>", { prefixIdentifiers: true }).node;
            expect(node.source).toMatchObject({
                type: 8,
                children: [
                    { content: "_ctx.list" },
                    ".",
                    { content: "concat" },
                    "([",
                    { content: "_ctx.foo" },
                    "])"
                ]
            });
        });
        test('should not prefix v-for alias', function () {
            var node = parseWithForTransform("<div v-for=\"i in list\">{{ i }}{{ j }}</div>", { prefixIdentifiers: true }).node;
            var div = node.children[0];
            expect(div.children[0].content).toMatchObject({
                type: 4,
                content: "i"
            });
            expect(div.children[1].content).toMatchObject({
                type: 4,
                content: "_ctx.j"
            });
        });
        test('should not prefix v-for aliases (multiple)', function () {
            var node = parseWithForTransform("<div v-for=\"(i, j, k) in list\">{{ i + j + k }}{{ l }}</div>", { prefixIdentifiers: true }).node;
            var div = node.children[0];
            expect(div.children[0].content).toMatchObject({
                type: 8,
                children: [
                    { content: "i" },
                    " + ",
                    { content: "j" },
                    " + ",
                    { content: "k" }
                ]
            });
            expect(div.children[1].content).toMatchObject({
                type: 4,
                content: "_ctx.l"
            });
        });
        test('should prefix id outside of v-for', function () {
            var node = parseWithForTransform("<div><div v-for=\"i in list\" />{{ i }}</div>", { prefixIdentifiers: true }).node;
            expect(node.children[1].content).toMatchObject({
                type: 4,
                content: "_ctx.i"
            });
        });
        test('nested v-for', function () {
            var node = parseWithForTransform("<div v-for=\"i in list\">\n          <div v-for=\"i in list\">{{ i + j }}</div>{{ i }}\n        </div>", { prefixIdentifiers: true }).node;
            var outerDiv = node.children[0];
            var innerFor = outerDiv.children[0];
            var innerExp = innerFor.children[0]
                .children[0];
            expect(innerExp.content).toMatchObject({
                type: 8,
                children: [{ content: 'i' }, " + ", { content: "_ctx.j" }]
            });
            var outerExp = outerDiv.children[1];
            expect(outerExp.content).toMatchObject({
                type: 4,
                content: "i"
            });
        });
        test('v-for aliases w/ complex expressions', function () {
            var node = parseWithForTransform("<div v-for=\"({ foo = bar, baz: [qux = quux] }) in list\">\n          {{ foo + bar + baz + qux + quux }}\n        </div>", { prefixIdentifiers: true }).node;
            expect(node.valueAlias).toMatchObject({
                type: 8,
                children: [
                    "{ ",
                    { content: "foo" },
                    " = ",
                    { content: "_ctx.bar" },
                    ", baz: [",
                    { content: "qux" },
                    " = ",
                    { content: "_ctx.quux" },
                    "] }"
                ]
            });
            var div = node.children[0];
            expect(div.children[0].content).toMatchObject({
                type: 8,
                children: [
                    { content: "foo" },
                    " + ",
                    { content: "_ctx.bar" },
                    " + ",
                    { content: "_ctx.baz" },
                    " + ",
                    { content: "qux" },
                    " + ",
                    { content: "_ctx.quux" }
                ]
            });
        });
    });
    describe('codegen', function () {
        function assertSharedCodegen(node, keyed, customReturn) {
            if (keyed === void 0) { keyed = false; }
            if (customReturn === void 0) { customReturn = false; }
            expect(node).toMatchObject({
                type: 18,
                expressions: [
                    {
                        type: 13,
                        callee: runtimeHelpers_1.OPEN_BLOCK
                    },
                    {
                        type: 13,
                        callee: runtimeHelpers_1.CREATE_BLOCK,
                        arguments: [
                            runtimeHelpers_1.FRAGMENT,
                            "null",
                            {
                                type: 13,
                                callee: runtimeHelpers_1.RENDER_LIST,
                                arguments: [
                                    {},
                                    {
                                        type: 17,
                                        returns: customReturn
                                            ? {}
                                            : {
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
                                            }
                                    }
                                ]
                            },
                            keyed
                                ? testUtils_1.genFlagText(runtime_dom_1.PatchFlags.KEYED_FRAGMENT)
                                : testUtils_1.genFlagText(runtime_dom_1.PatchFlags.UNKEYED_FRAGMENT)
                        ]
                    }
                ]
            });
            var renderListArgs = node.expressions[1]
                .arguments[2].arguments;
            return {
                source: renderListArgs[0],
                params: renderListArgs[1].params,
                returns: renderListArgs[1].returns,
                blockArgs: customReturn
                    ? null
                    : renderListArgs[1].returns.expressions[1].arguments
            };
        }
        test('basic v-for', function () {
            var _a = parseWithForTransform('<span v-for="(item) in items" />'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }],
                blockArgs: ["\"span\""]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('value + key + index', function () {
            var _a = parseWithForTransform('<span v-for="(item, key, index) in items" />'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }, { content: "key" }, { content: "index" }]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('skipped value', function () {
            var _a = parseWithForTransform('<span v-for="(, key, index) in items" />'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "_" }, { content: "key" }, { content: "index" }]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('skipped key', function () {
            var _a = parseWithForTransform('<span v-for="(item,,index) in items" />'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }, { content: "__" }, { content: "index" }]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('skipped value & key', function () {
            var _a = parseWithForTransform('<span v-for="(,,index) in items" />'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "_" }, { content: "__" }, { content: "index" }]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('template v-for', function () {
            var _a = parseWithForTransform('<template v-for="item in items">hello<span/></template>'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }],
                blockArgs: [
                    runtimeHelpers_1.FRAGMENT,
                    "null",
                    [
                        { type: 2, content: "hello" },
                        { type: 1, tag: "span" }
                    ]
                ]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('template v-for w/ <slot/>', function () {
            var _a = parseWithForTransform('<template v-for="item in items"><slot/></template>'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode, false, true)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }],
                returns: {
                    type: 13,
                    callee: runtimeHelpers_1.RENDER_SLOT
                }
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('v-for on <slot/>', function () {
            var _a = parseWithForTransform('<slot v-for="item in items"></slot>'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode, false, true)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }],
                returns: {
                    type: 13,
                    callee: runtimeHelpers_1.RENDER_SLOT
                }
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('keyed v-for', function () {
            var _a = parseWithForTransform('<span v-for="(item) in items" :key="item" />'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode, true)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }],
                blockArgs: [
                    "\"span\"",
                    testUtils_1.createObjectMatcher({
                        key: "[item]"
                    })
                ]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('keyed template v-for', function () {
            var _a = parseWithForTransform('<template v-for="item in items" :key="item">hello<span/></template>'), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(assertSharedCodegen(codegenNode, true)).toMatchObject({
                source: { content: "items" },
                params: [{ content: "item" }],
                blockArgs: [
                    runtimeHelpers_1.FRAGMENT,
                    testUtils_1.createObjectMatcher({
                        key: "[item]"
                    }),
                    [
                        { type: 2, content: "hello" },
                        { type: 1, tag: "span" }
                    ]
                ]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('v-if + v-for', function () {
            var _a = parseWithForTransform("<div v-if=\"ok\" v-for=\"i in list\"/>"), root = _a.root, codegenNode = _a.node.codegenNode;
            expect(codegenNode).toMatchObject({
                type: 18,
                expressions: [
                    {
                        type: 13,
                        callee: runtimeHelpers_1.OPEN_BLOCK,
                        arguments: []
                    },
                    {
                        type: 19,
                        test: { content: "ok" },
                        consequent: {
                            type: 13,
                            callee: runtimeHelpers_1.CREATE_BLOCK,
                            arguments: [
                                runtimeHelpers_1.FRAGMENT,
                                testUtils_1.createObjectMatcher({ key: "[0]" }),
                                {
                                    type: 13,
                                    callee: runtimeHelpers_1.RENDER_LIST,
                                    arguments: [
                                        { content: "list" },
                                        {
                                            type: 17,
                                            params: [{ content: "i" }],
                                            returns: {
                                                type: 18,
                                                expressions: [
                                                    {
                                                        type: 13,
                                                        callee: runtimeHelpers_1.OPEN_BLOCK
                                                    },
                                                    {
                                                        type: 13,
                                                        callee: runtimeHelpers_1.CREATE_BLOCK,
                                                        arguments: ["\"div\""]
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                },
                                testUtils_1.genFlagText(runtime_dom_1.PatchFlags.UNKEYED_FRAGMENT)
                            ]
                        }
                    }
                ]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
        test('v-for on element with custom directive', function () {
            var _a = parseWithForTransform('<div v-for="i in list" v-foo/>'), root = _a.root, codegenNode = _a.node.codegenNode;
            var returns = assertSharedCodegen(codegenNode, false, true).returns;
            expect(returns).toMatchObject({
                type: 18,
                expressions: [
                    { callee: runtimeHelpers_1.OPEN_BLOCK },
                    {
                        callee: runtimeHelpers_1.WITH_DIRECTIVES,
                        arguments: [
                            { callee: runtimeHelpers_1.CREATE_BLOCK },
                            { type: 16 }
                        ]
                    }
                ]
            });
            expect(src_1.generate(root).code).toMatchSnapshot();
        });
    });
});
