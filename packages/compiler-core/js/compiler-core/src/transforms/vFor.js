"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transform_1 = require("../transform");
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var transformExpression_1 = require("./transformExpression");
var shared_1 = require("@vue/shared");
exports.transformFor = transform_1.createStructuralDirectiveTransform('for', function (node, dir, context) {
    if (!dir.exp) {
        context.onError(errors_1.createCompilerError(37, dir.loc));
        return;
    }
    var parseResult = parseForExpression(dir.exp, context);
    if (!parseResult) {
        context.onError(errors_1.createCompilerError(38, dir.loc));
        return;
    }
    var helper = context.helper, addIdentifiers = context.addIdentifiers, removeIdentifiers = context.removeIdentifiers, scopes = context.scopes;
    var source = parseResult.source, value = parseResult.value, key = parseResult.key, index = parseResult.index;
    var renderExp = ast_1.createCallExpression(helper(runtimeHelpers_1.RENDER_LIST), [source]);
    var keyProp = utils_1.findProp(node, "key");
    var fragmentFlag = keyProp
        ? shared_1.PatchFlags.KEYED_FRAGMENT
        : shared_1.PatchFlags.UNKEYED_FRAGMENT;
    var codegenNode = ast_1.createSequenceExpression([
        ast_1.createCallExpression(helper(runtimeHelpers_1.OPEN_BLOCK), ["false"]),
        ast_1.createCallExpression(helper(runtimeHelpers_1.CREATE_BLOCK), [
            helper(runtimeHelpers_1.FRAGMENT),
            "null",
            renderExp,
            fragmentFlag + (__DEV__ ? " /* " + shared_1.PatchFlagNames[fragmentFlag] + " */" : "")
        ])
    ]);
    context.replaceNode({
        type: 11,
        loc: dir.loc,
        source: source,
        valueAlias: value,
        keyAlias: key,
        objectIndexAlias: index,
        children: node.tagType === 3 ? node.children : [node],
        codegenNode: codegenNode
    });
    scopes.vFor++;
    if (!__BROWSER__ && context.prefixIdentifiers) {
        value && addIdentifiers(value);
        key && addIdentifiers(key);
        index && addIdentifiers(index);
    }
    return function () {
        scopes.vFor--;
        if (!__BROWSER__ && context.prefixIdentifiers) {
            value && removeIdentifiers(value);
            key && removeIdentifiers(key);
            index && removeIdentifiers(index);
        }
        var childBlock;
        var isTemplate = utils_1.isTemplateNode(node);
        var slotOutlet = utils_1.isSlotOutlet(node)
            ? node
            : isTemplate &&
                node.children.length === 1 &&
                utils_1.isSlotOutlet(node.children[0])
                ? node.children[0]
                : null;
        var keyProperty = keyProp
            ? ast_1.createObjectProperty("key", keyProp.type === 6
                ? ast_1.createSimpleExpression(keyProp.value.content, true)
                : keyProp.exp)
            : null;
        if (slotOutlet) {
            childBlock = slotOutlet.codegenNode;
            if (isTemplate && keyProperty) {
                utils_1.injectProp(childBlock, keyProperty, context);
            }
        }
        else if (isTemplate) {
            childBlock = utils_1.createBlockExpression(ast_1.createCallExpression(helper(runtimeHelpers_1.CREATE_BLOCK), [
                helper(runtimeHelpers_1.FRAGMENT),
                keyProperty ? ast_1.createObjectExpression([keyProperty]) : "null",
                node.children
            ]), context);
        }
        else {
            var codegenNode_1 = node.codegenNode;
            if (codegenNode_1.callee === runtimeHelpers_1.WITH_DIRECTIVES) {
                codegenNode_1.arguments[0].callee = helper(runtimeHelpers_1.CREATE_BLOCK);
            }
            else {
                codegenNode_1.callee = helper(runtimeHelpers_1.CREATE_BLOCK);
            }
            childBlock = utils_1.createBlockExpression(codegenNode_1, context);
        }
        renderExp.arguments.push(ast_1.createFunctionExpression(createForLoopParams(parseResult), childBlock, true));
    };
});
var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
var stripParensRE = /^\(|\)$/g;
function parseForExpression(input, context) {
    var loc = input.loc;
    var exp = input.content;
    var inMatch = exp.match(forAliasRE);
    if (!inMatch)
        return;
    var LHS = inMatch[1], RHS = inMatch[2];
    var result = {
        source: createAliasExpression(loc, RHS.trim(), exp.indexOf(RHS, LHS.length)),
        value: undefined,
        key: undefined,
        index: undefined
    };
    if (!__BROWSER__ && context.prefixIdentifiers) {
        result.source = transformExpression_1.processExpression(result.source, context);
    }
    var valueContent = LHS.trim()
        .replace(stripParensRE, '')
        .trim();
    var trimmedOffset = LHS.indexOf(valueContent);
    var iteratorMatch = valueContent.match(forIteratorRE);
    if (iteratorMatch) {
        valueContent = valueContent.replace(forIteratorRE, '').trim();
        var keyContent = iteratorMatch[1].trim();
        var keyOffset = void 0;
        if (keyContent) {
            keyOffset = exp.indexOf(keyContent, trimmedOffset + valueContent.length);
            result.key = createAliasExpression(loc, keyContent, keyOffset);
            if (!__BROWSER__ && context.prefixIdentifiers) {
                result.key = transformExpression_1.processExpression(result.key, context, true);
            }
        }
        if (iteratorMatch[2]) {
            var indexContent = iteratorMatch[2].trim();
            if (indexContent) {
                result.index = createAliasExpression(loc, indexContent, exp.indexOf(indexContent, result.key
                    ? keyOffset + keyContent.length
                    : trimmedOffset + valueContent.length));
                if (!__BROWSER__ && context.prefixIdentifiers) {
                    result.index = transformExpression_1.processExpression(result.index, context, true);
                }
            }
        }
    }
    if (valueContent) {
        result.value = createAliasExpression(loc, valueContent, trimmedOffset);
        if (!__BROWSER__ && context.prefixIdentifiers) {
            result.value = transformExpression_1.processExpression(result.value, context, true);
        }
    }
    return result;
}
exports.parseForExpression = parseForExpression;
function createAliasExpression(range, content, offset) {
    return ast_1.createSimpleExpression(content, false, utils_1.getInnerRange(range, offset, content.length));
}
function createForLoopParams(_a) {
    var value = _a.value, key = _a.key, index = _a.index;
    var params = [];
    if (value) {
        params.push(value);
    }
    if (key) {
        if (!value) {
            params.push(ast_1.createSimpleExpression("_", false));
        }
        params.push(key);
    }
    if (index) {
        if (!key) {
            if (!value) {
                params.push(ast_1.createSimpleExpression("_", false));
            }
            params.push(ast_1.createSimpleExpression("__", false));
        }
        params.push(index);
    }
    return params;
}
exports.createForLoopParams = createForLoopParams;
