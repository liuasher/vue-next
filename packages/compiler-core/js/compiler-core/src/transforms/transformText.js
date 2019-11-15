"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var runtimeHelpers_1 = require("../runtimeHelpers");
var shared_1 = require("@vue/shared");
var isText = function (node) {
    return node.type === 5 || node.type === 2;
};
exports.transformText = function (node, context) {
    if (node.type === 0 || node.type === 1) {
        return function () {
            var children = node.children;
            var currentContainer = undefined;
            var hasText = false;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (isText(child)) {
                    hasText = true;
                    for (var j = i + 1; j < children.length; j++) {
                        var next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 8,
                                    loc: child.loc,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(" + ", next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
            if (hasText && children.length > 1) {
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (isText(child) || child.type === 8) {
                        var callArgs = [];
                        if (child.type !== 2 || child.content !== ' ') {
                            callArgs.push(child);
                        }
                        if (child.type !== 2) {
                            callArgs.push(shared_1.PatchFlags.TEXT + " /* " + shared_1.PatchFlagNames[shared_1.PatchFlags.TEXT] + " */");
                        }
                        children[i] = {
                            type: 12,
                            content: child,
                            loc: child.loc,
                            codegenNode: ast_1.createCallExpression(context.helper(runtimeHelpers_1.CREATE_TEXT), callArgs)
                        };
                    }
                }
            }
        };
    }
};
