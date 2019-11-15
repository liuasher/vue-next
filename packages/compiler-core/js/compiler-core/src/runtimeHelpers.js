"use strict";
var _a;
const __DEV__ = true
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAGMENT = Symbol(__DEV__ ? "Fragment" : "");
exports.PORTAL = Symbol(__DEV__ ? "Portal" : "");
exports.SUSPENSE = Symbol(__DEV__ ? "Suspense" : "");
exports.OPEN_BLOCK = Symbol(__DEV__ ? "openBlock" : "");
exports.CREATE_BLOCK = Symbol(__DEV__ ? "createBlock" : "");
exports.CREATE_VNODE = Symbol(__DEV__ ? "createVNode" : "");
exports.CREATE_COMMENT = Symbol(__DEV__ ? "createCommentVNode" : "");
exports.CREATE_TEXT = Symbol(__DEV__ ? "createTextVNode" : "");
exports.RESOLVE_COMPONENT = Symbol(__DEV__ ? "resolveComponent" : "");
exports.RESOLVE_DYNAMIC_COMPONENT = Symbol(__DEV__ ? "resolveDynamicComponent" : "");
exports.RESOLVE_DIRECTIVE = Symbol(__DEV__ ? "resolveDirective" : "");
exports.WITH_DIRECTIVES = Symbol(__DEV__ ? "withDirectives" : "");
exports.RENDER_LIST = Symbol(__DEV__ ? "renderList" : "");
exports.RENDER_SLOT = Symbol(__DEV__ ? "renderSlot" : "");
exports.CREATE_SLOTS = Symbol(__DEV__ ? "createSlots" : "");
exports.TO_STRING = Symbol(__DEV__ ? "toString" : "");
exports.MERGE_PROPS = Symbol(__DEV__ ? "mergeProps" : "");
exports.TO_HANDLERS = Symbol(__DEV__ ? "toHandlers" : "");
exports.CAMELIZE = Symbol(__DEV__ ? "camelize" : "");
exports.SET_BLOCK_TRACKING = Symbol(__DEV__ ? "setBlockTracking" : "");
exports.helperNameMap = (_a = {},
    _a[exports.FRAGMENT] = "Fragment",
    _a[exports.PORTAL] = "Portal",
    _a[exports.SUSPENSE] = "Suspense",
    _a[exports.OPEN_BLOCK] = "openBlock",
    _a[exports.CREATE_BLOCK] = "createBlock",
    _a[exports.CREATE_VNODE] = "createVNode",
    _a[exports.CREATE_COMMENT] = "createCommentVNode",
    _a[exports.CREATE_TEXT] = "createTextVNode",
    _a[exports.RESOLVE_COMPONENT] = "resolveComponent",
    _a[exports.RESOLVE_DYNAMIC_COMPONENT] = "resolveDynamicComponent",
    _a[exports.RESOLVE_DIRECTIVE] = "resolveDirective",
    _a[exports.WITH_DIRECTIVES] = "withDirectives",
    _a[exports.RENDER_LIST] = "renderList",
    _a[exports.RENDER_SLOT] = "renderSlot",
    _a[exports.CREATE_SLOTS] = "createSlots",
    _a[exports.TO_STRING] = "toString",
    _a[exports.MERGE_PROPS] = "mergeProps",
    _a[exports.TO_HANDLERS] = "toHandlers",
    _a[exports.CAMELIZE] = "camelize",
    _a[exports.SET_BLOCK_TRACKING] = "setBlockTracking",
    _a);
function registerRuntimeHelpers(helpers) {
    Object.getOwnPropertySymbols(helpers).forEach(function (s) {
        exports.helperNameMap[s] = helpers[s];
    });
}
exports.registerRuntimeHelpers = registerRuntimeHelpers;
