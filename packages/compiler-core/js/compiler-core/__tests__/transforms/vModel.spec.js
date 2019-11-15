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
var vModel_1 = require("../../src/transforms/vModel");
var transformElement_1 = require("../../src/transforms/transformElement");
var transformExpression_1 = require("../../src/transforms/transformExpression");
var vFor_1 = require("../../src/transforms/vFor");
var vSlot_1 = require("../../src/transforms/vSlot");
function parseWithVModel(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ nodeTransforms: [
            vFor_1.transformFor,
            transformExpression_1.transformExpression,
            transformElement_1.transformElement,
            vSlot_1.trackSlotScopes
        ], directiveTransforms: __assign(__assign({}, options.directiveTransforms), { model: vModel_1.transformModel }) }, options));
    return ast;
}
describe('compiler: transform v-model', function () {
    test('simple exprssion', function () {
        var root = parseWithVModel('<input v-model="model" />');
        var node = root.children[0];
        var props = node.codegenNode
            .arguments[1].properties;
        expect(props[0]).toMatchObject({
            key: {
                content: 'modelValue',
                isStatic: true
            },
            value: {
                content: 'model',
                isStatic: false
            }
        });
        expect(props[1]).toMatchObject({
            key: {
                content: 'onUpdate:modelValue',
                isStatic: true
            },
            value: {
                children: [
                    '$event => (',
                    {
                        content: 'model',
                        isStatic: false
                    },
                    ' = $event)'
                ]
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('simple exprssion (with prefixIdentifiers)', function () {
        var root = parseWithVModel('<input v-model="model" />', {
            prefixIdentifiers: true
        });
        var node = root.children[0];
        var props = node.codegenNode
            .arguments[1].properties;
        expect(props[0]).toMatchObject({
            key: {
                content: 'modelValue',
                isStatic: true
            },
            value: {
                content: '_ctx.model',
                isStatic: false
            }
        });
        expect(props[1]).toMatchObject({
            key: {
                content: 'onUpdate:modelValue',
                isStatic: true
            },
            value: {
                children: [
                    '$event => (',
                    {
                        content: '_ctx.model',
                        isStatic: false
                    },
                    ' = $event)'
                ]
            }
        });
        expect(src_1.generate(root, { mode: 'module' }).code).toMatchSnapshot();
    });
    test('compound expression', function () {
        var root = parseWithVModel('<input v-model="model[index]" />');
        var node = root.children[0];
        var props = node.codegenNode
            .arguments[1].properties;
        expect(props[0]).toMatchObject({
            key: {
                content: 'modelValue',
                isStatic: true
            },
            value: {
                content: 'model[index]',
                isStatic: false
            }
        });
        expect(props[1]).toMatchObject({
            key: {
                content: 'onUpdate:modelValue',
                isStatic: true
            },
            value: {
                children: [
                    '$event => (',
                    {
                        content: 'model[index]',
                        isStatic: false
                    },
                    ' = $event)'
                ]
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('compound expression (with prefixIdentifiers)', function () {
        var root = parseWithVModel('<input v-model="model[index]" />', {
            prefixIdentifiers: true
        });
        var node = root.children[0];
        var props = node.codegenNode
            .arguments[1].properties;
        expect(props[0]).toMatchObject({
            key: {
                content: 'modelValue',
                isStatic: true
            },
            value: {
                children: [
                    {
                        content: '_ctx.model',
                        isStatic: false
                    },
                    '[',
                    {
                        content: '_ctx.index',
                        isStatic: false
                    },
                    ']'
                ]
            }
        });
        expect(props[1]).toMatchObject({
            key: {
                content: 'onUpdate:modelValue',
                isStatic: true
            },
            value: {
                children: [
                    '$event => (',
                    {
                        content: '_ctx.model',
                        isStatic: false
                    },
                    '[',
                    {
                        content: '_ctx.index',
                        isStatic: false
                    },
                    ']',
                    ' = $event)'
                ]
            }
        });
        expect(src_1.generate(root, { mode: 'module' }).code).toMatchSnapshot();
    });
    test('with argument', function () {
        var root = parseWithVModel('<input v-model:value="model" />');
        var node = root.children[0];
        var props = node.codegenNode
            .arguments[1].properties;
        expect(props[0]).toMatchObject({
            key: {
                content: 'value',
                isStatic: true
            },
            value: {
                content: 'model',
                isStatic: false
            }
        });
        expect(props[1]).toMatchObject({
            key: {
                content: 'onUpdate:value',
                isStatic: true
            },
            value: {
                children: [
                    '$event => (',
                    {
                        content: 'model',
                        isStatic: false
                    },
                    ' = $event)'
                ]
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('with dynamic argument', function () {
        var root = parseWithVModel('<input v-model:[value]="model" />');
        var node = root.children[0];
        var props = node.codegenNode
            .arguments[1].properties;
        expect(props[0]).toMatchObject({
            key: {
                content: 'value',
                isStatic: false
            },
            value: {
                content: 'model',
                isStatic: false
            }
        });
        expect(props[1]).toMatchObject({
            key: {
                children: [
                    {
                        content: 'onUpdate:',
                        isStatic: true
                    },
                    '+',
                    {
                        content: 'value',
                        isStatic: false
                    }
                ]
            },
            value: {
                children: [
                    '$event => (',
                    {
                        content: 'model',
                        isStatic: false
                    },
                    ' = $event)'
                ]
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('with dynamic argument (with prefixIdentifiers)', function () {
        var root = parseWithVModel('<input v-model:[value]="model" />', {
            prefixIdentifiers: true
        });
        var node = root.children[0];
        var props = node.codegenNode
            .arguments[1].properties;
        expect(props[0]).toMatchObject({
            key: {
                content: '_ctx.value',
                isStatic: false
            },
            value: {
                content: '_ctx.model',
                isStatic: false
            }
        });
        expect(props[1]).toMatchObject({
            key: {
                children: [
                    {
                        content: 'onUpdate:',
                        isStatic: true
                    },
                    '+',
                    {
                        content: '_ctx.value',
                        isStatic: false
                    }
                ]
            },
            value: {
                children: [
                    '$event => (',
                    {
                        content: '_ctx.model',
                        isStatic: false
                    },
                    ' = $event)'
                ]
            }
        });
        expect(src_1.generate(root, { mode: 'module' }).code).toMatchSnapshot();
    });
    test('should cache update handler w/ cacheHandlers: true', function () {
        var root = parseWithVModel('<input v-model="foo" />', {
            prefixIdentifiers: true,
            cacheHandlers: true
        });
        expect(root.cached).toBe(1);
        var codegen = root.children[0]
            .codegenNode;
        expect(codegen.arguments[4]).toBe("[\"modelValue\"]");
        expect(codegen.arguments[1].properties[1].value.type).toBe(20);
    });
    test('should not cache update handler if it refers v-for scope variables', function () {
        var root = parseWithVModel('<input v-for="i in list" v-model="foo[i]" />', {
            prefixIdentifiers: true,
            cacheHandlers: true
        });
        expect(root.cached).toBe(0);
        var codegen = root.children[0]
            .children[0].codegenNode;
        expect(codegen.arguments[4]).toBe("[\"modelValue\", \"onUpdate:modelValue\"]");
        expect(codegen.arguments[1].properties[1].value.type).not.toBe(20);
    });
    test('should mark update handler dynamic if it refers slot scope variables', function () {
        var root = parseWithVModel('<Comp v-slot="{ foo }"><input v-model="foo.bar"/></Comp>', {
            prefixIdentifiers: true
        });
        var codegen = root.children[0]
            .children[0].codegenNode;
        expect(codegen.arguments[4]).toBe("[\"modelValue\", \"onUpdate:modelValue\"]");
    });
    test('should generate modelModifers for component v-model', function () {
        var root = parseWithVModel('<Comp v-model.trim.bar-baz="foo" />', {
            prefixIdentifiers: true
        });
        var args = root.children[0]
            .codegenNode.arguments;
        expect(args[1]).toMatchObject({
            properties: [
                { key: { content: "modelValue" } },
                { key: { content: "onUpdate:modelValue" } },
                {
                    key: { content: 'modelModifiers' },
                    value: { content: "{ trim: true, \"bar-baz\": true }", isStatic: false }
                }
            ]
        });
        expect(args[4]).toBe("[\"modelValue\", \"onUpdate:modelValue\"]");
    });
    describe('errors', function () {
        test('missing expression', function () {
            var onError = jest.fn();
            parseWithVModel('<span v-model />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 47
            }));
        });
        test('empty expression', function () {
            var onError = jest.fn();
            parseWithVModel('<span v-model="" />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 48
            }));
        });
        test('mal-formed expression', function () {
            var onError = jest.fn();
            parseWithVModel('<span v-model="a + b" />', { onError: onError });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 48
            }));
        });
        test('used on scope variable', function () {
            var onError = jest.fn();
            parseWithVModel('<span v-for="i in list" v-model="i" />', {
                onError: onError,
                prefixIdentifiers: true
            });
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                code: 49
            }));
        });
    });
});
