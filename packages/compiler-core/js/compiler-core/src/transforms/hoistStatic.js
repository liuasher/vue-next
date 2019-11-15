"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var runtimeHelpers_1 = require("../runtimeHelpers");
var shared_1 = require("@vue/shared");
var utils_1 = require("../utils");
function hoistStatic(root, context) {
    walk(root.children, context, new Map(), isSingleElementRoot(root, root.children[0]));
}
exports.hoistStatic = hoistStatic;
function isSingleElementRoot(root, child) {
    var children = root.children;
    return (children.length === 1 &&
        child.type === 1 &&
        !utils_1.isSlotOutlet(child));
}
exports.isSingleElementRoot = isSingleElementRoot;
function walk(children, context, resultCache, doNotHoistNode) {
    if (doNotHoistNode === void 0) { doNotHoistNode = false; }
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.type === 1 &&
            child.tagType === 0) {
            if (!doNotHoistNode && isStaticNode(child, resultCache)) {
                child.codegenNode = context.hoist(child.codegenNode);
                continue;
            }
            else {
                var codegenNode = child.codegenNode;
                if (codegenNode.type === 13) {
                    var flag = getPatchFlag(codegenNode);
                    if ((!flag ||
                        flag === shared_1.PatchFlags.NEED_PATCH ||
                        flag === shared_1.PatchFlags.TEXT) &&
                        !hasDynamicKeyOrRef(child) &&
                        !hasCachedProps(child)) {
                        var props = getNodeProps(child);
                        if (props && props !== "null") {
                            getVNodeCall(codegenNode).arguments[1] = context.hoist(props);
                        }
                    }
                }
            }
        }
        if (child.type === 1) {
            walk(child.children, context, resultCache);
        }
        else if (child.type === 11) {
            walk(child.children, context, resultCache, child.children.length === 1);
        }
        else if (child.type === 9) {
            for (var i_1 = 0; i_1 < child.branches.length; i_1++) {
                var branchChildren = child.branches[i_1].children;
                walk(branchChildren, context, resultCache, branchChildren.length === 1);
            }
        }
    }
}
function isStaticNode(node, resultCache) {
    if (resultCache === void 0) { resultCache = new Map(); }
    switch (node.type) {
        case 1:
            if (node.tagType !== 0) {
                return false;
            }
            var cached = resultCache.get(node);
            if (cached !== undefined) {
                return cached;
            }
            var codegenNode = node.codegenNode;
            if (codegenNode.type !== 13) {
                return false;
            }
            var flag = getPatchFlag(codegenNode);
            if (!flag && !hasDynamicKeyOrRef(node) && !hasCachedProps(node)) {
                for (var i = 0; i < node.children.length; i++) {
                    if (!isStaticNode(node.children[i], resultCache)) {
                        resultCache.set(node, false);
                        return false;
                    }
                }
                resultCache.set(node, true);
                return true;
            }
            else {
                resultCache.set(node, false);
                return false;
            }
        case 2:
        case 3:
            return true;
        case 9:
        case 11:
            return false;
        case 5:
        case 12:
            return isStaticNode(node.content, resultCache);
        case 4:
            return node.isConstant;
        case 8:
            return node.children.every(function (child) {
                return (shared_1.isString(child) || shared_1.isSymbol(child) || isStaticNode(child, resultCache));
            });
        default:
            if (__DEV__) {
                var exhaustiveCheck = node;
                exhaustiveCheck;
            }
            return false;
    }
}
exports.isStaticNode = isStaticNode;
function hasDynamicKeyOrRef(node) {
    return !!(utils_1.findProp(node, 'key', true) || utils_1.findProp(node, 'ref', true));
}
function hasCachedProps(node) {
    if (__BROWSER__) {
        return false;
    }
    var props = getNodeProps(node);
    if (props &&
        props !== 'null' &&
        props.type === 14) {
        var properties = props.properties;
        for (var i = 0; i < properties.length; i++) {
            if (properties[i].value.type === 20) {
                return true;
            }
        }
    }
    return false;
}
function getNodeProps(node) {
    var codegenNode = node.codegenNode;
    if (codegenNode.type === 13) {
        return getVNodeArgAt(codegenNode, 1);
    }
}
function getVNodeArgAt(node, index) {
    return getVNodeCall(node).arguments[index];
}
function getVNodeCall(node) {
    return node.callee === runtimeHelpers_1.WITH_DIRECTIVES ? node.arguments[0] : node;
}
function getPatchFlag(node) {
    var flag = getVNodeArgAt(node, 3);
    return flag ? parseInt(flag, 10) : undefined;
}
