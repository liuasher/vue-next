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
var ast_1 = require("./ast");
var runtimeHelpers_1 = require("./runtimeHelpers");
var shared_1 = require("../../shared/js/index");
var _parse;
var _walk;
function loadDep(name) {
    if (typeof process !== 'undefined' && shared_1.isFunction(require)) {
        return require(name);
    }
    else {
        return window._deps[name];
    }
}
exports.loadDep = loadDep;
exports.parseJS = function (code, options) {
    assert(!__BROWSER__, "Expression AST analysis can only be performed in non-browser builds.");
    var parse = _parse || (_parse = loadDep('acorn').parse);
    return parse(code, options);
};
exports.walkJS = function (ast, walker) {
    assert(!__BROWSER__, "Expression AST analysis can only be performed in non-browser builds.");
    var walk = _walk || (_walk = loadDep('estree-walker').walk);
    return walk(ast, walker);
};
var nonIdentifierRE = /^\d|[^\$\w]/;
exports.isSimpleIdentifier = function (name) {
    return !nonIdentifierRE.test(name);
};
var memberExpRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*$/;
exports.isMemberExpression = function (path) {
    return memberExpRE.test(path);
};
function getInnerRange(loc, offset, length) {
    __DEV__ && assert(offset <= loc.source.length);
    var source = loc.source.substr(offset, length);
    var newLoc = {
        source: source,
        start: advancePositionWithClone(loc.start, loc.source, offset),
        end: loc.end
    };
    if (length != null) {
        __DEV__ && assert(offset + length <= loc.source.length);
        newLoc.end = advancePositionWithClone(loc.start, loc.source, offset + length);
    }
    return newLoc;
}
exports.getInnerRange = getInnerRange;
function advancePositionWithClone(pos, source, numberOfCharacters) {
    if (numberOfCharacters === void 0) { numberOfCharacters = source.length; }
    return advancePositionWithMutation(__assign({}, pos), source, numberOfCharacters);
}
exports.advancePositionWithClone = advancePositionWithClone;
function advancePositionWithMutation(pos, source, numberOfCharacters) {
    if (numberOfCharacters === void 0) { numberOfCharacters = source.length; }
    var linesCount = 0;
    var lastNewLinePos = -1;
    for (var i = 0; i < numberOfCharacters; i++) {
        if (source.charCodeAt(i) === 10) {
            linesCount++;
            lastNewLinePos = i;
        }
    }
    pos.offset += numberOfCharacters;
    pos.line += linesCount;
    pos.column =
        lastNewLinePos === -1
            ? pos.column + numberOfCharacters
            : Math.max(1, numberOfCharacters - lastNewLinePos);
    return pos;
}
exports.advancePositionWithMutation = advancePositionWithMutation;
function assert(condition, msg) {
    if (!condition) {
        throw new Error(msg || "unexpected compiler condition");
    }
}
exports.assert = assert;
function findDir(node, name, allowEmpty) {
    if (allowEmpty === void 0) { allowEmpty = false; }
    for (var i = 0; i < node.props.length; i++) {
        var p = node.props[i];
        if (p.type === 7 &&
            (allowEmpty || p.exp) &&
            (shared_1.isString(name) ? p.name === name : name.test(p.name))) {
            return p;
        }
    }
}
exports.findDir = findDir;
function findProp(node, name, dynamicOnly) {
    if (dynamicOnly === void 0) { dynamicOnly = false; }
    for (var i = 0; i < node.props.length; i++) {
        var p = node.props[i];
        if (p.type === 6) {
            if (dynamicOnly)
                continue;
            if (p.name === name && p.value) {
                return p;
            }
        }
        else if (p.name === 'bind' &&
            p.arg &&
            p.arg.type === 4 &&
            p.arg.isStatic &&
            p.arg.content === name &&
            p.exp) {
            return p;
        }
    }
}
exports.findProp = findProp;
function createBlockExpression(blockExp, context) {
    return ast_1.createSequenceExpression([
        ast_1.createCallExpression(context.helper(runtimeHelpers_1.OPEN_BLOCK)),
        blockExp
    ]);
}
exports.createBlockExpression = createBlockExpression;
function isVSlot(p) {
    return p.type === 7 && p.name === 'slot';
}
exports.isVSlot = isVSlot;
function isTemplateNode(node) {
    return (node.type === 1 && node.tagType === 3);
}
exports.isTemplateNode = isTemplateNode;
function isSlotOutlet(node) {
    return node.type === 1 && node.tagType === 2;
}
exports.isSlotOutlet = isSlotOutlet;
function injectProp(node, prop, context) {
    var propsWithInjection;
    var props = node.callee === runtimeHelpers_1.RENDER_SLOT ? node.arguments[2] : node.arguments[1];
    if (props == null || shared_1.isString(props)) {
        propsWithInjection = ast_1.createObjectExpression([prop]);
    }
    else if (props.type === 13) {
        var first = props.arguments[0];
        if (!shared_1.isString(first) && first.type === 14) {
            first.properties.unshift(prop);
        }
        else {
            props.arguments.unshift(ast_1.createObjectExpression([prop]));
        }
        propsWithInjection = props;
    }
    else if (props.type === 14) {
        props.properties.unshift(prop);
        propsWithInjection = props;
    }
    else {
        propsWithInjection = ast_1.createCallExpression(context.helper(runtimeHelpers_1.MERGE_PROPS), [
            ast_1.createObjectExpression([prop]),
            props
        ]);
    }
    if (node.callee === runtimeHelpers_1.RENDER_SLOT) {
        node.arguments[2] = propsWithInjection;
    }
    else {
        node.arguments[1] = propsWithInjection;
    }
}
exports.injectProp = injectProp;
function toValidAssetId(name, type) {
    return "_" + type + "_" + name.replace(/[^\w]/g, '_');
}
exports.toValidAssetId = toValidAssetId;
function hasScopeRef(node, ids) {
    if (!node || Object.keys(ids).length === 0) {
        return false;
    }
    switch (node.type) {
        case 1:
            for (var i = 0; i < node.props.length; i++) {
                var p = node.props[i];
                if (p.type === 7 &&
                    (hasScopeRef(p.arg, ids) || hasScopeRef(p.exp, ids))) {
                    return true;
                }
            }
            return node.children.some(function (c) { return hasScopeRef(c, ids); });
        case 11:
            if (hasScopeRef(node.source, ids)) {
                return true;
            }
            return node.children.some(function (c) { return hasScopeRef(c, ids); });
        case 9:
            return node.branches.some(function (b) { return hasScopeRef(b, ids); });
        case 10:
            if (hasScopeRef(node.condition, ids)) {
                return true;
            }
            return node.children.some(function (c) { return hasScopeRef(c, ids); });
        case 4:
            return (!node.isStatic &&
                exports.isSimpleIdentifier(node.content) &&
                !!ids[node.content]);
        case 8:
            return node.children.some(function (c) { return shared_1.isObject(c) && hasScopeRef(c, ids); });
        case 5:
        case 12:
            return hasScopeRef(node.content, ids);
        case 2:
        case 3:
            return false;
        default:
            if (__DEV__) {
                var exhaustiveCheck = node;
                exhaustiveCheck;
            }
            return false;
    }
}
exports.hasScopeRef = hasScopeRef;
