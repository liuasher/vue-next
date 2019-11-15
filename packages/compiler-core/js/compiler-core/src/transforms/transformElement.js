"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var shared_1 = require("@vue/shared");
var errors_1 = require("../errors");
var runtimeHelpers_1 = require("../runtimeHelpers");
var utils_1 = require("../utils");
var vSlot_1 = require("./vSlot");
var hoistStatic_1 = require("./hoistStatic");
var directiveImportMap = new WeakMap();
exports.transformElement = function (node, context) {
    if (node.type !== 1 ||
        node.tagType === 2 ||
        (node.tagType === 3 && node.props.some(utils_1.isVSlot))) {
        return;
    }
    return function () {
        var isComponent = node.tagType === 1;
        var hasProps = node.props.length > 0;
        var patchFlag = 0;
        var runtimeDirectives;
        var dynamicPropNames;
        var dynamicComponent;
        var isProp = utils_1.findProp(node, 'is');
        if (node.tag === 'component') {
            if (isProp) {
                if (isProp.type === 6) {
                    var tag = isProp.value && isProp.value.content;
                    if (tag) {
                        context.helper(runtimeHelpers_1.RESOLVE_COMPONENT);
                        context.components.add(tag);
                        dynamicComponent = utils_1.toValidAssetId(tag, "component");
                    }
                }
                else if (isProp.exp) {
                    dynamicComponent = ast_1.createCallExpression(context.helper(runtimeHelpers_1.RESOLVE_DYNAMIC_COMPONENT), [isProp.exp]);
                }
            }
        }
        if (isComponent && !dynamicComponent) {
            context.helper(runtimeHelpers_1.RESOLVE_COMPONENT);
            context.components.add(node.tag);
        }
        var args = [
            dynamicComponent
                ? dynamicComponent
                : isComponent
                    ? utils_1.toValidAssetId(node.tag, "component")
                    : node.tagType === 4
                        ? context.helper(runtimeHelpers_1.PORTAL)
                        : node.tagType === 5
                            ? context.helper(runtimeHelpers_1.SUSPENSE)
                            : "\"" + node.tag + "\""
        ];
        if (hasProps) {
            var propsBuildResult = buildProps(node, context, node.props.filter(function (p) { return p !== isProp; }));
            patchFlag = propsBuildResult.patchFlag;
            dynamicPropNames = propsBuildResult.dynamicPropNames;
            runtimeDirectives = propsBuildResult.directives;
            if (!propsBuildResult.props) {
                hasProps = false;
            }
            else {
                args.push(propsBuildResult.props);
            }
        }
        var hasChildren = node.children.length > 0;
        if (hasChildren) {
            if (!hasProps) {
                args.push("null");
            }
            if (isComponent || node.tagType === 5) {
                var _a = vSlot_1.buildSlots(node, context), slots = _a.slots, hasDynamicSlots = _a.hasDynamicSlots;
                args.push(slots);
                if (hasDynamicSlots) {
                    patchFlag |= shared_1.PatchFlags.DYNAMIC_SLOTS;
                }
            }
            else if (node.children.length === 1) {
                var child = node.children[0];
                var type = child.type;
                var hasDynamicTextChild = type === 5 ||
                    type === 8;
                if (hasDynamicTextChild && !hoistStatic_1.isStaticNode(child)) {
                    patchFlag |= shared_1.PatchFlags.TEXT;
                }
                if (hasDynamicTextChild || type === 2) {
                    args.push(child);
                }
                else {
                    args.push(node.children);
                }
            }
            else {
                args.push(node.children);
            }
        }
        if (patchFlag !== 0) {
            if (!hasChildren) {
                if (!hasProps) {
                    args.push("null");
                }
                args.push("null");
            }
            if (__DEV__) {
                var flagNames = Object.keys(shared_1.PatchFlagNames)
                    .map(Number)
                    .filter(function (n) { return n > 0 && patchFlag & n; })
                    .map(function (n) { return shared_1.PatchFlagNames[n]; })
                    .join(", ");
                args.push(patchFlag + (" /* " + flagNames + " */"));
            }
            else {
                args.push(patchFlag + '');
            }
            if (dynamicPropNames && dynamicPropNames.length) {
                args.push("[" + dynamicPropNames.map(function (n) { return JSON.stringify(n); }).join(", ") + "]");
            }
        }
        var loc = node.loc;
        var vnode = ast_1.createCallExpression(context.helper(runtimeHelpers_1.CREATE_VNODE), args, loc);
        if (runtimeDirectives && runtimeDirectives.length) {
            node.codegenNode = ast_1.createCallExpression(context.helper(runtimeHelpers_1.WITH_DIRECTIVES), [
                vnode,
                ast_1.createArrayExpression(runtimeDirectives.map(function (dir) { return buildDirectiveArgs(dir, context); }), loc)
            ], loc);
        }
        else {
            node.codegenNode = vnode;
        }
    };
};
function buildProps(node, context, props) {
    if (props === void 0) { props = node.props; }
    var elementLoc = node.loc;
    var isComponent = node.tagType === 1;
    var properties = [];
    var mergeArgs = [];
    var runtimeDirectives = [];
    var patchFlag = 0;
    var hasRef = false;
    var hasClassBinding = false;
    var hasStyleBinding = false;
    var hasDynamicKeys = false;
    var dynamicPropNames = [];
    var analyzePatchFlag = function (_a) {
        var key = _a.key, value = _a.value;
        if (key.type === 4 && key.isStatic) {
            if (value.type === 20 ||
                ((value.type === 4 ||
                    value.type === 8) &&
                    hoistStatic_1.isStaticNode(value))) {
                return;
            }
            var name_1 = key.content;
            if (name_1 === 'ref') {
                hasRef = true;
            }
            else if (name_1 === 'class') {
                hasClassBinding = true;
            }
            else if (name_1 === 'style') {
                hasStyleBinding = true;
            }
            else if (name_1 !== 'key') {
                dynamicPropNames.push(name_1);
            }
        }
        else {
            hasDynamicKeys = true;
        }
    };
    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if (prop.type === 6) {
            var loc = prop.loc, name_2 = prop.name, value = prop.value;
            if (name_2 === 'ref') {
                hasRef = true;
            }
            properties.push(ast_1.createObjectProperty(ast_1.createSimpleExpression(name_2, true, utils_1.getInnerRange(loc, 0, name_2.length)), ast_1.createSimpleExpression(value ? value.content : '', true, value ? value.loc : loc)));
        }
        else {
            var name_3 = prop.name, arg = prop.arg, exp = prop.exp, loc = prop.loc;
            if (name_3 === 'slot') {
                if (!isComponent) {
                    context.onError(errors_1.createCompilerError(46, loc));
                }
                continue;
            }
            if (name_3 === 'once') {
                continue;
            }
            var isBind = name_3 === 'bind';
            var isOn = name_3 === 'on';
            if (!arg && (isBind || isOn)) {
                hasDynamicKeys = true;
                if (exp) {
                    if (properties.length) {
                        mergeArgs.push(ast_1.createObjectExpression(dedupeProperties(properties), elementLoc));
                        properties = [];
                    }
                    if (isBind) {
                        mergeArgs.push(exp);
                    }
                    else {
                        mergeArgs.push({
                            type: 13,
                            loc: loc,
                            callee: context.helper(runtimeHelpers_1.TO_HANDLERS),
                            arguments: [exp]
                        });
                    }
                }
                else {
                    context.onError(errors_1.createCompilerError(isBind
                        ? 39
                        : 40, loc));
                }
                continue;
            }
            var directiveTransform = context.directiveTransforms[name_3];
            if (directiveTransform) {
                var _a = directiveTransform(prop, node, context), props_1 = _a.props, needRuntime = _a.needRuntime;
                props_1.forEach(analyzePatchFlag);
                properties.push.apply(properties, props_1);
                if (needRuntime) {
                    runtimeDirectives.push(prop);
                    if (shared_1.isSymbol(needRuntime)) {
                        directiveImportMap.set(prop, needRuntime);
                    }
                }
            }
            else {
                runtimeDirectives.push(prop);
            }
        }
    }
    var propsExpression = undefined;
    if (mergeArgs.length) {
        if (properties.length) {
            mergeArgs.push(ast_1.createObjectExpression(dedupeProperties(properties), elementLoc));
        }
        if (mergeArgs.length > 1) {
            propsExpression = ast_1.createCallExpression(context.helper(runtimeHelpers_1.MERGE_PROPS), mergeArgs, elementLoc);
        }
        else {
            propsExpression = mergeArgs[0];
        }
    }
    else if (properties.length) {
        propsExpression = ast_1.createObjectExpression(dedupeProperties(properties), elementLoc);
    }
    if (hasDynamicKeys) {
        patchFlag |= shared_1.PatchFlags.FULL_PROPS;
    }
    else {
        if (hasClassBinding) {
            patchFlag |= shared_1.PatchFlags.CLASS;
        }
        if (hasStyleBinding) {
            patchFlag |= shared_1.PatchFlags.STYLE;
        }
        if (dynamicPropNames.length) {
            patchFlag |= shared_1.PatchFlags.PROPS;
        }
    }
    if (patchFlag === 0 && (hasRef || runtimeDirectives.length > 0)) {
        patchFlag |= shared_1.PatchFlags.NEED_PATCH;
    }
    return {
        props: propsExpression,
        directives: runtimeDirectives,
        patchFlag: patchFlag,
        dynamicPropNames: dynamicPropNames
    };
}
exports.buildProps = buildProps;
function dedupeProperties(properties) {
    var knownProps = {};
    var deduped = [];
    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];
        if (prop.key.type === 8 || !prop.key.isStatic) {
            deduped.push(prop);
            continue;
        }
        var name_4 = prop.key.content;
        var existing = knownProps[name_4];
        if (existing) {
            if (name_4 === 'style' ||
                name_4 === 'class' ||
                name_4.startsWith('on') ||
                name_4.startsWith('vnode')) {
                mergeAsArray(existing, prop);
            }
        }
        else {
            knownProps[name_4] = prop;
            deduped.push(prop);
        }
    }
    return deduped;
}
function mergeAsArray(existing, incoming) {
    if (existing.value.type === 16) {
        existing.value.elements.push(incoming.value);
    }
    else {
        existing.value = ast_1.createArrayExpression([existing.value, incoming.value], existing.loc);
    }
}
function buildDirectiveArgs(dir, context) {
    var dirArgs = [];
    var runtime = directiveImportMap.get(dir);
    if (runtime) {
        context.helper(runtime);
        dirArgs.push(context.helperString(runtime));
    }
    else {
        context.helper(runtimeHelpers_1.RESOLVE_DIRECTIVE);
        context.directives.add(dir.name);
        dirArgs.push(utils_1.toValidAssetId(dir.name, "directive"));
    }
    var loc = dir.loc;
    if (dir.exp)
        dirArgs.push(dir.exp);
    if (dir.arg) {
        if (!dir.exp) {
            dirArgs.push("void 0");
        }
        dirArgs.push(dir.arg);
    }
    if (Object.keys(dir.modifiers).length) {
        if (!dir.arg) {
            if (!dir.exp) {
                dirArgs.push("void 0");
            }
            dirArgs.push("void 0");
        }
        dirArgs.push(ast_1.createObjectExpression(dir.modifiers.map(function (modifier) {
            return ast_1.createObjectProperty(modifier, ast_1.createSimpleExpression("true", false, loc));
        }), loc));
    }
    return ast_1.createArrayExpression(dirArgs, dir.loc);
}
