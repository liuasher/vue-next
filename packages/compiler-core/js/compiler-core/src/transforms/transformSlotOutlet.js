"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var utils_1 = require("../utils");
var transformElement_1 = require("./transformElement");
var errors_1 = require("../errors");
var runtimeHelpers_1 = require("../runtimeHelpers");
exports.transformSlotOutlet = function (node, context) {
    if (utils_1.isSlotOutlet(node)) {
        var props = node.props, children = node.children, loc = node.loc;
        var $slots = context.prefixIdentifiers ? "_ctx.$slots" : "$slots";
        var slotName = "\"default\"";
        var nameIndex = -1;
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            if (prop.type === 6) {
                if (prop.name === "name" && prop.value) {
                    slotName = JSON.stringify(prop.value.content);
                    nameIndex = i;
                    break;
                }
            }
            else if (prop.name === "bind") {
                var arg = prop.arg, exp = prop.exp;
                if (arg &&
                    exp &&
                    arg.type === 4 &&
                    arg.isStatic &&
                    arg.content === "name") {
                    slotName = exp;
                    nameIndex = i;
                    break;
                }
            }
        }
        var slotArgs = [$slots, slotName];
        var propsWithoutName = nameIndex > -1
            ? props.slice(0, nameIndex).concat(props.slice(nameIndex + 1))
            : props;
        var hasProps = propsWithoutName.length > 0;
        if (hasProps) {
            var _a = transformElement_1.buildProps(node, context, propsWithoutName), propsExpression = _a.props, directives = _a.directives;
            if (directives.length) {
                context.onError(errors_1.createCompilerError(41, directives[0].loc));
            }
            if (propsExpression) {
                slotArgs.push(propsExpression);
            }
            else {
                hasProps = false;
            }
        }
        if (children.length) {
            if (!hasProps) {
                slotArgs.push("{}");
            }
            slotArgs.push(children);
        }
        node.codegenNode = ast_1.createCallExpression(context.helper(runtimeHelpers_1.RENDER_SLOT), slotArgs, loc);
    }
};
