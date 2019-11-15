"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("./ast");
var shared_1 = require("../../shared/js/index");
var errors_1 = require("./errors");
var runtimeHelpers_1 = require("./runtimeHelpers");
var utils_1 = require("./utils");
var hoistStatic_1 = require("./transforms/hoistStatic");
function createTransformContext(root, _a) {
    var _b = _a.prefixIdentifiers, prefixIdentifiers = _b === void 0 ? false : _b, _c = _a.hoistStatic, hoistStatic = _c === void 0 ? false : _c, _d = _a.cacheHandlers, cacheHandlers = _d === void 0 ? false : _d, _e = _a.nodeTransforms, nodeTransforms = _e === void 0 ? [] : _e, _f = _a.directiveTransforms, directiveTransforms = _f === void 0 ? {} : _f, _g = _a.onError, onError = _g === void 0 ? errors_1.defaultOnError : _g;
    var context = {
        root: root,
        helpers: new Set(),
        components: new Set(),
        directives: new Set(),
        hoists: [],
        cached: 0,
        identifiers: {},
        scopes: {
            vFor: 0,
            vSlot: 0,
            vPre: 0,
            vOnce: 0
        },
        prefixIdentifiers: prefixIdentifiers,
        hoistStatic: hoistStatic,
        cacheHandlers: cacheHandlers,
        nodeTransforms: nodeTransforms,
        directiveTransforms: directiveTransforms,
        onError: onError,
        parent: null,
        currentNode: root,
        childIndex: 0,
        helper: function (name) {
            context.helpers.add(name);
            return name;
        },
        helperString: function (name) {
            return ((context.prefixIdentifiers ? "" : "_") +
                runtimeHelpers_1.helperNameMap[context.helper(name)]);
        },
        replaceNode: function (node) {
            if (__DEV__) {
                if (!context.currentNode) {
                    throw new Error("Node being replaced is already removed.");
                }
                if (!context.parent) {
                    throw new Error("Cannot replace root node.");
                }
            }
            context.parent.children[context.childIndex] = context.currentNode = node;
        },
        removeNode: function (node) {
            if (__DEV__ && !context.parent) {
                throw new Error("Cannot remove root node.");
            }
            var list = context.parent.children;
            var removalIndex = node
                ? list.indexOf(node)
                : context.currentNode
                    ? context.childIndex
                    : -1;
            if (__DEV__ && removalIndex < 0) {
                throw new Error("node being removed is not a child of current parent");
            }
            if (!node || node === context.currentNode) {
                context.currentNode = null;
                context.onNodeRemoved();
            }
            else {
                if (context.childIndex > removalIndex) {
                    context.childIndex--;
                    context.onNodeRemoved();
                }
            }
            context.parent.children.splice(removalIndex, 1);
        },
        onNodeRemoved: function () { },
        addIdentifiers: function (exp) {
            if (!__BROWSER__) {
                if (shared_1.isString(exp)) {
                    addId(exp);
                }
                else if (exp.identifiers) {
                    exp.identifiers.forEach(addId);
                }
                else if (exp.type === 4) {
                    addId(exp.content);
                }
            }
        },
        removeIdentifiers: function (exp) {
            if (!__BROWSER__) {
                if (shared_1.isString(exp)) {
                    removeId(exp);
                }
                else if (exp.identifiers) {
                    exp.identifiers.forEach(removeId);
                }
                else if (exp.type === 4) {
                    removeId(exp.content);
                }
            }
        },
        hoist: function (exp) {
            context.hoists.push(exp);
            return ast_1.createSimpleExpression("_hoisted_" + context.hoists.length, false, exp.loc, true);
        },
        cache: function (exp, isVNode) {
            if (isVNode === void 0) { isVNode = false; }
            return ast_1.createCacheExpression(++context.cached, exp, isVNode);
        }
    };
    function addId(id) {
        var identifiers = context.identifiers;
        if (identifiers[id] === undefined) {
            identifiers[id] = 0;
        }
        identifiers[id]++;
    }
    function removeId(id) {
        context.identifiers[id]--;
    }
    return context;
}
function transform(root, options) {
    var context = createTransformContext(root, options);
    traverseNode(root, context);
    if (options.hoistStatic) {
        hoistStatic_1.hoistStatic(root, context);
    }
    finalizeRoot(root, context);
}
exports.transform = transform;
function finalizeRoot(root, context) {
    var helper = context.helper;
    var children = root.children;
    var child = children[0];
    if (children.length === 1) {
        if (hoistStatic_1.isSingleElementRoot(root, child) && child.codegenNode) {
            var codegenNode = child.codegenNode;
            if (codegenNode.type !== 20) {
                if (codegenNode.callee === runtimeHelpers_1.WITH_DIRECTIVES) {
                    codegenNode.arguments[0].callee = helper(runtimeHelpers_1.CREATE_BLOCK);
                }
                else {
                    codegenNode.callee = helper(runtimeHelpers_1.CREATE_BLOCK);
                }
                root.codegenNode = utils_1.createBlockExpression(codegenNode, context);
            }
            else {
                root.codegenNode = codegenNode;
            }
        }
        else {
            root.codegenNode = child;
        }
    }
    else if (children.length > 1) {
        root.codegenNode = utils_1.createBlockExpression(ast_1.createCallExpression(helper(runtimeHelpers_1.CREATE_BLOCK), [
            helper(runtimeHelpers_1.FRAGMENT),
            "null",
            root.children
        ]), context);
    }
    else {
    }
    root.helpers = __spreadArrays(context.helpers);
    root.components = __spreadArrays(context.components);
    root.directives = __spreadArrays(context.directives);
    root.hoists = context.hoists;
    root.cached = context.cached;
}
function traverseChildren(parent, context) {
    var i = 0;
    var nodeRemoved = function () {
        i--;
    };
    for (; i < parent.children.length; i++) {
        var child = parent.children[i];
        if (shared_1.isString(child))
            continue;
        context.currentNode = child;
        context.parent = parent;
        context.childIndex = i;
        context.onNodeRemoved = nodeRemoved;
        traverseNode(child, context);
    }
}
exports.traverseChildren = traverseChildren;
function traverseNode(node, context) {
    var nodeTransforms = context.nodeTransforms;
    var exitFns = [];
    for (var i_1 = 0; i_1 < nodeTransforms.length; i_1++) {
        var onExit = nodeTransforms[i_1](node, context);
        if (onExit) {
            if (shared_1.isArray(onExit)) {
                exitFns.push.apply(exitFns, onExit);
            }
            else {
                exitFns.push(onExit);
            }
        }
        if (!context.currentNode) {
            return;
        }
        else {
            node = context.currentNode;
        }
    }
    switch (node.type) {
        case 3:
            context.helper(runtimeHelpers_1.CREATE_COMMENT);
            break;
        case 5:
            context.helper(runtimeHelpers_1.TO_STRING);
            break;
        case 9:
            for (var i_2 = 0; i_2 < node.branches.length; i_2++) {
                traverseChildren(node.branches[i_2], context);
            }
            break;
        case 11:
        case 1:
        case 0:
            traverseChildren(node, context);
            break;
    }
    var i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
exports.traverseNode = traverseNode;
function createStructuralDirectiveTransform(name, fn) {
    var matches = shared_1.isString(name)
        ? function (n) { return n === name; }
        : function (n) { return name.test(n); };
    return function (node, context) {
        if (node.type === 1) {
            var props = node.props;
            if (node.tagType === 3 && props.some(utils_1.isVSlot)) {
                return;
            }
            var exitFns = [];
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                if (prop.type === 7 && matches(prop.name)) {
                    props.splice(i, 1);
                    i--;
                    var onExit = fn(node, prop, context);
                    if (onExit)
                        exitFns.push(onExit);
                }
            }
            return exitFns;
        }
    };
}
exports.createStructuralDirectiveTransform = createStructuralDirectiveTransform;
