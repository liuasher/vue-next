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
var vOnce_1 = require("../../src/transforms/vOnce");
var transformElement_1 = require("../../src/transforms/transformElement");
var runtimeHelpers_1 = require("../../src/runtimeHelpers");
var vBind_1 = require("../../src/transforms/vBind");
var transformSlotOutlet_1 = require("../../src/transforms/transformSlotOutlet");
function transformWithOnce(template, options) {
    if (options === void 0) { options = {}; }
    var ast = src_1.parse(template);
    src_1.transform(ast, __assign({ nodeTransforms: [vOnce_1.transformOnce, transformElement_1.transformElement, transformSlotOutlet_1.transformSlotOutlet], directiveTransforms: {
            bind: vBind_1.transformBind
        } }, options));
    return ast;
}
describe('compiler: v-once transform', function () {
    test('as root node', function () {
        var root = transformWithOnce("<div :id=\"foo\" v-once />");
        expect(root.cached).toBe(1);
        expect(root.helpers).toContain(runtimeHelpers_1.SET_BLOCK_TRACKING);
        expect(root.codegenNode).toMatchObject({
            type: 20,
            index: 1,
            value: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('on nested plain element', function () {
        var root = transformWithOnce("<div><div :id=\"foo\" v-once /></div>");
        expect(root.cached).toBe(1);
        expect(root.helpers).toContain(runtimeHelpers_1.SET_BLOCK_TRACKING);
        expect(root.children[0].children[0].codegenNode).toMatchObject({
            type: 20,
            index: 1,
            value: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('on component', function () {
        var root = transformWithOnce("<div><Comp :id=\"foo\" v-once /></div>");
        expect(root.cached).toBe(1);
        expect(root.helpers).toContain(runtimeHelpers_1.SET_BLOCK_TRACKING);
        expect(root.children[0].children[0].codegenNode).toMatchObject({
            type: 20,
            index: 1,
            value: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('on slot outlet', function () {
        var root = transformWithOnce("<div><slot v-once /></div>");
        expect(root.cached).toBe(1);
        expect(root.helpers).toContain(runtimeHelpers_1.SET_BLOCK_TRACKING);
        expect(root.children[0].children[0].codegenNode).toMatchObject({
            type: 20,
            index: 1,
            value: {
                type: 13,
                callee: runtimeHelpers_1.RENDER_SLOT
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
    test('with hoistStatic: true', function () {
        var root = transformWithOnce("<div><div v-once /></div>", {
            hoistStatic: true
        });
        expect(root.cached).toBe(1);
        expect(root.helpers).toContain(runtimeHelpers_1.SET_BLOCK_TRACKING);
        expect(root.hoists.length).toBe(0);
        expect(root.children[0].children[0].codegenNode).toMatchObject({
            type: 20,
            index: 1,
            value: {
                type: 13,
                callee: runtimeHelpers_1.CREATE_VNODE
            }
        });
        expect(src_1.generate(root).code).toMatchSnapshot();
    });
});
