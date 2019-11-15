"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
exports.transformOnce = function (node, context) {
    if (node.type === 1 && utils_1.findDir(node, 'once', true)) {
        context.helper(runtimeHelpers_1.SET_BLOCK_TRACKING);
        return function () {
            if (node.codegenNode) {
                node.codegenNode = context.cache(node.codegenNode, true);
            }
        };
    }
};
