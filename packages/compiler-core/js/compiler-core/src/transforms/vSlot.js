"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var vFor_1 = require("./vFor");
var isStaticExp = function (p) {
    return p.type === 4 && p.isStatic;
};
var defaultFallback = ast_1.createSimpleExpression("undefined", false);
exports.trackSlotScopes = function (node, context) {
    if (node.type === 1 &&
        (node.tagType === 1 ||
            node.tagType === 3)) {
        var vSlot = utils_1.findDir(node, 'slot');
        if (vSlot) {
            var slotProps_1 = vSlot.exp;
            if (!__BROWSER__ && context.prefixIdentifiers) {
                slotProps_1 && context.addIdentifiers(slotProps_1);
            }
            context.scopes.vSlot++;
            return function () {
                if (!__BROWSER__ && context.prefixIdentifiers) {
                    slotProps_1 && context.removeIdentifiers(slotProps_1);
                }
                context.scopes.vSlot--;
            };
        }
    }
};
exports.trackVForSlotScopes = function (node, context) {
    var vFor;
    if (utils_1.isTemplateNode(node) &&
        node.props.some(utils_1.isVSlot) &&
        (vFor = utils_1.findDir(node, 'for'))) {
        var result = (vFor.parseResult = vFor_1.parseForExpression(vFor.exp, context));
        if (result) {
            var value_1 = result.value, key_1 = result.key, index_1 = result.index;
            var addIdentifiers = context.addIdentifiers, removeIdentifiers_1 = context.removeIdentifiers;
            value_1 && addIdentifiers(value_1);
            key_1 && addIdentifiers(key_1);
            index_1 && addIdentifiers(index_1);
            return function () {
                value_1 && removeIdentifiers_1(value_1);
                key_1 && removeIdentifiers_1(key_1);
                index_1 && removeIdentifiers_1(index_1);
            };
        }
    }
};
function buildSlots(node, context) {
    var children = node.children, loc = node.loc;
    var slotsProperties = [];
    var dynamicSlots = [];
    var hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0;
    if (!__BROWSER__ && context.prefixIdentifiers) {
        hasDynamicSlots = utils_1.hasScopeRef(node, context.identifiers);
    }
    var explicitDefaultSlot = utils_1.findDir(node, 'slot', true);
    if (explicitDefaultSlot) {
        var arg = explicitDefaultSlot.arg, exp = explicitDefaultSlot.exp, loc_1 = explicitDefaultSlot.loc;
        if (arg) {
            context.onError(errors_1.createCompilerError(42, loc_1));
        }
        slotsProperties.push(buildDefaultSlot(exp, children, loc_1));
    }
    var hasTemplateSlots = false;
    var extraneousChild = undefined;
    var seenSlotNames = new Set();
    for (var i = 0; i < children.length; i++) {
        var slotElement = children[i];
        var slotDir = void 0;
        if (!utils_1.isTemplateNode(slotElement) ||
            !(slotDir = utils_1.findDir(slotElement, 'slot', true))) {
            if (slotElement.type !== 3 && !extraneousChild) {
                extraneousChild = slotElement;
            }
            continue;
        }
        if (explicitDefaultSlot) {
            context.onError(errors_1.createCompilerError(43, slotDir.loc));
            break;
        }
        hasTemplateSlots = true;
        var slotChildren = slotElement.children, slotLoc = slotElement.loc;
        var _a = slotDir.arg, slotName = _a === void 0 ? ast_1.createSimpleExpression("default", true) : _a, slotProps = slotDir.exp, dirLoc = slotDir.loc;
        var staticSlotName = void 0;
        if (isStaticExp(slotName)) {
            staticSlotName = slotName ? slotName.content : "default";
        }
        else {
            hasDynamicSlots = true;
        }
        var slotFunction = ast_1.createFunctionExpression(slotProps, slotChildren, false, slotChildren.length ? slotChildren[0].loc : slotLoc);
        var vIf = void 0;
        var vElse = void 0;
        var vFor = void 0;
        if ((vIf = utils_1.findDir(slotElement, 'if'))) {
            hasDynamicSlots = true;
            dynamicSlots.push(ast_1.createConditionalExpression(vIf.exp, buildDynamicSlot(slotName, slotFunction), defaultFallback));
        }
        else if ((vElse = utils_1.findDir(slotElement, /^else(-if)?$/, true))) {
            var j = i;
            var prev = void 0;
            while (j--) {
                prev = children[j];
                if (prev.type !== 3) {
                    break;
                }
            }
            if (prev && utils_1.isTemplateNode(prev) && utils_1.findDir(prev, 'if')) {
                children.splice(i, 1);
                i--;
                __DEV__ && utils_1.assert(dynamicSlots.length > 0);
                var conditional = dynamicSlots[dynamicSlots.length - 1];
                while (conditional.alternate.type === 19) {
                    conditional = conditional.alternate;
                }
                conditional.alternate = vElse.exp
                    ? ast_1.createConditionalExpression(vElse.exp, buildDynamicSlot(slotName, slotFunction), defaultFallback)
                    : buildDynamicSlot(slotName, slotFunction);
            }
            else {
                context.onError(errors_1.createCompilerError(36, vElse.loc));
            }
        }
        else if ((vFor = utils_1.findDir(slotElement, 'for'))) {
            hasDynamicSlots = true;
            var parseResult = vFor.parseResult ||
                vFor_1.parseForExpression(vFor.exp, context);
            if (parseResult) {
                dynamicSlots.push(ast_1.createCallExpression(context.helper(runtimeHelpers_1.RENDER_LIST), [
                    parseResult.source,
                    ast_1.createFunctionExpression(vFor_1.createForLoopParams(parseResult), buildDynamicSlot(slotName, slotFunction), true)
                ]));
            }
            else {
                context.onError(errors_1.createCompilerError(38, vFor.loc));
            }
        }
        else {
            if (staticSlotName) {
                if (seenSlotNames.has(staticSlotName)) {
                    context.onError(errors_1.createCompilerError(44, dirLoc));
                    continue;
                }
                seenSlotNames.add(staticSlotName);
            }
            slotsProperties.push(ast_1.createObjectProperty(slotName, slotFunction));
        }
    }
    if (hasTemplateSlots && extraneousChild) {
        context.onError(errors_1.createCompilerError(45, extraneousChild.loc));
    }
    if (!explicitDefaultSlot && !hasTemplateSlots) {
        slotsProperties.push(buildDefaultSlot(undefined, children, loc));
    }
    var slots = ast_1.createObjectExpression(slotsProperties.concat(ast_1.createObjectProperty("_compiled", ast_1.createSimpleExpression("true", false))), loc);
    if (dynamicSlots.length) {
        slots = ast_1.createCallExpression(context.helper(runtimeHelpers_1.CREATE_SLOTS), [
            slots,
            ast_1.createArrayExpression(dynamicSlots)
        ]);
    }
    return {
        slots: slots,
        hasDynamicSlots: hasDynamicSlots
    };
}
exports.buildSlots = buildSlots;
function buildDefaultSlot(slotProps, children, loc) {
    return ast_1.createObjectProperty("default", ast_1.createFunctionExpression(slotProps, children, false, children.length ? children[0].loc : loc));
}
function buildDynamicSlot(name, fn) {
    return ast_1.createObjectExpression([
        ast_1.createObjectProperty("name", name),
        ast_1.createObjectProperty("fn", fn)
    ]);
}
