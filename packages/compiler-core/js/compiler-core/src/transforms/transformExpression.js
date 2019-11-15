"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var utils_1 = require("../utils");
var shared_1 = require("@vue/shared");
var errors_1 = require("../errors");
var isLiteralWhitelisted = shared_1.makeMap('true,false,null,this');
exports.transformExpression = function (node, context) {
    if (node.type === 5) {
        node.content = processExpression(node.content, context);
    }
    else if (node.type === 1) {
        for (var i = 0; i < node.props.length; i++) {
            var dir = node.props[i];
            if (dir.type === 7 && dir.name !== 'for') {
                var exp = dir.exp;
                var arg = dir.arg;
                if (exp && !(dir.name === 'on' && arg)) {
                    dir.exp = processExpression(exp, context, dir.name === 'slot');
                }
                if (arg && !arg.isStatic) {
                    dir.arg = processExpression(arg, context);
                }
            }
        }
    }
};
function processExpression(node, context, asParams) {
    if (asParams === void 0) { asParams = false; }
    if (!context.prefixIdentifiers || !node.content.trim()) {
        return node;
    }
    var rawExp = node.content;
    if (utils_1.isSimpleIdentifier(rawExp)) {
        if (!asParams &&
            !context.identifiers[rawExp] &&
            !shared_1.isGloballyWhitelisted(rawExp) &&
            !isLiteralWhitelisted(rawExp)) {
            node.content = "_ctx." + rawExp;
        }
        else if (!context.identifiers[rawExp]) {
            node.isConstant = true;
        }
        return node;
    }
    var ast;
    var source = "(" + rawExp + ")" + (asParams ? "=>{}" : "");
    try {
        ast = utils_1.parseJS(source, { ranges: true });
    }
    catch (e) {
        context.onError(errors_1.createCompilerError(50, node.loc));
        return node;
    }
    var ids = [];
    var knownIds = Object.create(context.identifiers);
    utils_1.walkJS(ast, {
        enter: function (node, parent) {
            if (node.type === 'Identifier') {
                if (!ids.includes(node)) {
                    var needPrefix = shouldPrefix(node, parent);
                    if (!knownIds[node.name] && needPrefix) {
                        if (isPropertyShorthand(node, parent)) {
                            node.prefix = node.name + ": ";
                        }
                        node.name = "_ctx." + node.name;
                        node.isConstant = false;
                        ids.push(node);
                    }
                    else if (!isStaticPropertyKey(node, parent)) {
                        node.isConstant = !(needPrefix && knownIds[node.name]);
                        ids.push(node);
                    }
                }
            }
            else if (isFunction(node)) {
                node.params.forEach(function (p) {
                    return utils_1.walkJS(p, {
                        enter: function (child, parent) {
                            if (child.type === 'Identifier' &&
                                !isStaticPropertyKey(child, parent) &&
                                !(parent &&
                                    parent.type === 'AssignmentPattern' &&
                                    parent.right === child)) {
                                var name_1 = child.name;
                                if (node.scopeIds && node.scopeIds.has(name_1)) {
                                    return;
                                }
                                if (name_1 in knownIds) {
                                    knownIds[name_1]++;
                                }
                                else {
                                    knownIds[name_1] = 1;
                                }
                                ;
                                (node.scopeIds || (node.scopeIds = new Set())).add(name_1);
                            }
                        }
                    });
                });
            }
        },
        leave: function (node) {
            if (node !== ast.body[0].expression && node.scopeIds) {
                node.scopeIds.forEach(function (id) {
                    knownIds[id]--;
                    if (knownIds[id] === 0) {
                        delete knownIds[id];
                    }
                });
            }
        }
    });
    var children = [];
    ids.sort(function (a, b) { return a.start - b.start; });
    ids.forEach(function (id, i) {
        var start = id.start - 1;
        var end = id.end - 1;
        var last = ids[i - 1];
        var leadingText = rawExp.slice(last ? last.end - 1 : 0, start);
        if (leadingText.length || id.prefix) {
            children.push(leadingText + (id.prefix || ""));
        }
        var source = rawExp.slice(start, end);
        children.push(ast_1.createSimpleExpression(id.name, false, {
            source: source,
            start: utils_1.advancePositionWithClone(node.loc.start, source, start),
            end: utils_1.advancePositionWithClone(node.loc.start, source, end)
        }, id.isConstant));
        if (i === ids.length - 1 && end < rawExp.length) {
            children.push(rawExp.slice(end));
        }
    });
    var ret;
    if (children.length) {
        ret = ast_1.createCompoundExpression(children, node.loc);
    }
    else {
        ret = node;
        ret.isConstant = true;
    }
    ret.identifiers = Object.keys(knownIds);
    return ret;
}
exports.processExpression = processExpression;
var isFunction = function (node) {
    return /Function(Expression|Declaration)$/.test(node.type);
};
var isPropertyKey = function (node, parent) {
    return parent &&
        parent.type === 'Property' &&
        parent.key === node &&
        !parent.computed;
};
var isPropertyShorthand = function (node, parent) {
    return isPropertyKey(node, parent) && parent.value === node;
};
var isStaticPropertyKey = function (node, parent) {
    return isPropertyKey(node, parent) && parent.value !== node;
};
function shouldPrefix(identifier, parent) {
    if (!(isFunction(parent) &&
        (parent.id === identifier ||
            parent.params.includes(identifier))) &&
        !isStaticPropertyKey(identifier, parent) &&
        !(parent.type === 'MemberExpression' &&
            parent.property === identifier &&
            !parent.computed) &&
        !(parent.type === 'ArrayPattern') &&
        !shared_1.isGloballyWhitelisted(identifier.name) &&
        identifier.name !== "require" &&
        identifier.name !== "arguments") {
        return true;
    }
}
