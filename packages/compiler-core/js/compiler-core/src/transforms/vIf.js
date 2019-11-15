"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var transform_1 = require("../transform");
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var transformExpression_1 = require("./transformExpression");
var runtimeHelpers_1 = require("../runtimeHelpers");
var utils_1 = require("../utils");
exports.transformIf = transform_1.createStructuralDirectiveTransform(/^(if|else|else-if)$/, function (node, dir, context) {
    if (dir.name !== 'else' &&
        (!dir.exp || !dir.exp.content.trim())) {
        var loc = dir.exp ? dir.exp.loc : node.loc;
        context.onError(errors_1.createCompilerError(35, dir.loc));
        dir.exp = ast_1.createSimpleExpression("true", false, loc);
    }
    if (!__BROWSER__ && context.prefixIdentifiers && dir.exp) {
        dir.exp = transformExpression_1.processExpression(dir.exp, context);
    }
    if (dir.name === 'if') {
        var branch_1 = createIfBranch(node, dir);
        var codegenNode_1 = ast_1.createSequenceExpression([
            ast_1.createCallExpression(context.helper(runtimeHelpers_1.OPEN_BLOCK))
        ]);
        context.replaceNode({
            type: 9,
            loc: node.loc,
            branches: [branch_1],
            codegenNode: codegenNode_1
        });
        return function () {
            codegenNode_1.expressions.push(createCodegenNodeForBranch(branch_1, 0, context));
        };
    }
    else {
        var siblings = context.parent.children;
        var comments = [];
        var i = siblings.indexOf(node);
        while (i-- >= -1) {
            var sibling = siblings[i];
            if (__DEV__ && sibling && sibling.type === 3) {
                context.removeNode(sibling);
                comments.unshift(sibling);
                continue;
            }
            if (sibling && sibling.type === 9) {
                context.removeNode();
                var branch = createIfBranch(node, dir);
                if (__DEV__ && comments.length) {
                    branch.children = __spreadArrays(comments, branch.children);
                }
                sibling.branches.push(branch);
                transform_1.traverseChildren(branch, context);
                context.currentNode = null;
                var parentCondition = sibling.codegenNode
                    .expressions[1];
                while (true) {
                    if (parentCondition.alternate.type ===
                        19) {
                        parentCondition = parentCondition.alternate;
                    }
                    else {
                        parentCondition.alternate = createCodegenNodeForBranch(branch, sibling.branches.length - 1, context);
                        break;
                    }
                }
            }
            else {
                context.onError(errors_1.createCompilerError(36, node.loc));
            }
            break;
        }
    }
});
function createIfBranch(node, dir) {
    return {
        type: 10,
        loc: node.loc,
        condition: dir.name === 'else' ? undefined : dir.exp,
        children: node.tagType === 3 ? node.children : [node]
    };
}
function createCodegenNodeForBranch(branch, index, context) {
    if (branch.condition) {
        return ast_1.createConditionalExpression(branch.condition, createChildrenCodegenNode(branch, index, context), ast_1.createCallExpression(context.helper(runtimeHelpers_1.CREATE_COMMENT), [
            __DEV__ ? '"v-if"' : '""',
            'true'
        ]));
    }
    else {
        return createChildrenCodegenNode(branch, index, context);
    }
}
function createChildrenCodegenNode(branch, index, context) {
    var helper = context.helper;
    var keyProperty = ast_1.createObjectProperty("key", ast_1.createSimpleExpression(index + '', false));
    var children = branch.children;
    var child = children[0];
    var needFragmentWrapper = children.length !== 1 || child.type !== 1;
    if (needFragmentWrapper) {
        var blockArgs = [
            helper(runtimeHelpers_1.FRAGMENT),
            ast_1.createObjectExpression([keyProperty]),
            children
        ];
        if (children.length === 1 && child.type === 11) {
            var forBlockArgs = child.codegenNode.expressions[1].arguments;
            blockArgs[2] = forBlockArgs[2];
            blockArgs[3] = forBlockArgs[3];
        }
        return ast_1.createCallExpression(helper(runtimeHelpers_1.CREATE_BLOCK), blockArgs);
    }
    else {
        var childCodegen = child.codegenNode;
        var vnodeCall = childCodegen;
        if (vnodeCall.callee === runtimeHelpers_1.WITH_DIRECTIVES) {
            vnodeCall = vnodeCall.arguments[0];
        }
        if (vnodeCall.callee === runtimeHelpers_1.CREATE_VNODE) {
            vnodeCall.callee = helper(runtimeHelpers_1.CREATE_BLOCK);
        }
        utils_1.injectProp(vnodeCall, keyProperty, context);
        return childCodegen;
    }
}
