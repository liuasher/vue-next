"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var shared_1 = require("../../shared/js/index");
var runtimeHelpers_1 = require("./runtimeHelpers");
const __BROWSER__ = true
function createCodegenContext(ast, _a) {
    var _b = _a.mode, mode = _b === void 0 ? 'function' : _b, _c = _a.prefixIdentifiers, prefixIdentifiers = _c === void 0 ? mode === 'module' : _c, _d = _a.sourceMap, sourceMap = _d === void 0 ? false : _d, _e = _a.filename, filename = _e === void 0 ? "template.vue.html" : _e;
    var context = {
        mode: mode,
        prefixIdentifiers: prefixIdentifiers,
        sourceMap: sourceMap,
        filename: filename,
        source: ast.loc.source,
        code: "",
        column: 1,
        line: 1,
        offset: 0,
        indentLevel: 0,
        map: __BROWSER__ || !sourceMap
            ? undefined
            : new (utils_1.loadDep('source-map')).SourceMapGenerator(),
        helper: function (key) {
            var name = runtimeHelpers_1.helperNameMap[key];
            return prefixIdentifiers ? name : "_" + name;
        },
        push: function (code, node, openOnly) {
            context.code += code;
            if (!__BROWSER__ && context.map) {
                if (node) {
                    var name_1;
                    if (node.type === 4 && !node.isStatic) {
                        var content = node.content.replace(/^_ctx\./, '');
                        if (content !== node.content && utils_1.isSimpleIdentifier(content)) {
                            name_1 = content;
                        }
                    }
                    addMapping(node.loc.start, name_1);
                }
                utils_1.advancePositionWithMutation(context, code);
                if (node && !openOnly) {
                    addMapping(node.loc.end);
                }
            }
        },
        resetMapping: function (loc) {
            if (!__BROWSER__ && context.map) {
                addMapping(loc.start);
            }
        },
        indent: function () {
            newline(++context.indentLevel);
        },
        deindent: function (withoutNewLine) {
            if (withoutNewLine === void 0) { withoutNewLine = false; }
            if (withoutNewLine) {
                --context.indentLevel;
            }
            else {
                newline(--context.indentLevel);
            }
        },
        newline: function () {
            newline(context.indentLevel);
        }
    };
    function newline(n) {
        context.push('\n' + "  ".repeat(n));
    }
    function addMapping(loc, name) {
        context.map.addMapping({
            name: name,
            source: context.filename,
            original: {
                line: loc.line,
                column: loc.column - 1
            },
            generated: {
                line: context.line,
                column: context.column - 1
            }
        });
    }
    if (!__BROWSER__ && context.map) {
        context.map.setSourceContent(filename, context.source);
    }
    return context;
}
function generate(ast, options) {
    if (options === void 0) { options = {}; }
    var context = createCodegenContext(ast, options);
    var mode = context.mode, push = context.push, helper = context.helper, prefixIdentifiers = context.prefixIdentifiers, indent = context.indent, deindent = context.deindent, newline = context.newline;
    var hasHelpers = ast.helpers.length > 0;
    var useWithBlock = !prefixIdentifiers && mode !== 'module';
    if (mode === 'function') {
        if (hasHelpers) {
            if (prefixIdentifiers) {
                push("const { " + ast.helpers.map(helper).join(', ') + " } = Vue\n");
            }
            else {
                push("const _Vue = Vue\n");
                if (ast.hoists.length) {
                    push("const _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + " = Vue." + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_VNODE] + "\n");
                    if (ast.helpers.includes(runtimeHelpers_1.CREATE_COMMENT)) {
                        push("const _" + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_COMMENT] + " = Vue." + runtimeHelpers_1.helperNameMap[runtimeHelpers_1.CREATE_COMMENT] + "\n");
                    }
                }
            }
        }
        genHoists(ast.hoists, context);
        newline();
        push("return ");
    }
    else {
        if (hasHelpers) {
            push("import { " + ast.helpers.map(helper).join(', ') + " } from \"vue\"\n");
        }
        genHoists(ast.hoists, context);
        newline();
        push("export default ");
    }
    push("function render() {");
    indent();
    if (useWithBlock) {
        push("with (this) {");
        indent();
        if (hasHelpers) {
            push("const { " + ast.helpers
                .map(function (s) { return runtimeHelpers_1.helperNameMap[s] + ": _" + runtimeHelpers_1.helperNameMap[s]; })
                .join(', ') + " } = _Vue");
            newline();
            if (ast.cached > 0) {
                push("const _cache = $cache");
                newline();
            }
            newline();
        }
    }
    else {
        push("const _ctx = this");
        if (ast.cached > 0) {
            newline();
            push("const _cache = _ctx.$cache");
        }
        newline();
    }
    if (ast.components.length) {
        genAssets(ast.components, 'component', context);
    }
    if (ast.directives.length) {
        genAssets(ast.directives, 'directive', context);
    }
    if (ast.components.length || ast.directives.length) {
        newline();
    }
    push("return ");
    if (ast.codegenNode) {
        genNode(ast.codegenNode, context);
    }
    else {
        push("null");
    }
    if (useWithBlock) {
        deindent();
        push("}");
    }
    deindent();
    push("}");
    return {
        ast: ast,
        code: context.code,
        map: undefined
    };
}
exports.generate = generate;
function genAssets(assets, type, context) {
    var resolver = context.helper(type === 'component' ? runtimeHelpers_1.RESOLVE_COMPONENT : runtimeHelpers_1.RESOLVE_DIRECTIVE);
    for (var i = 0; i < assets.length; i++) {
        var id = assets[i];
        context.push("const " + utils_1.toValidAssetId(id, type) + " = " + resolver + "(" + JSON.stringify(id) + ")");
        context.newline();
    }
}
function genHoists(hoists, context) {
    if (!hoists.length) {
        return;
    }
    context.newline();
    hoists.forEach(function (exp, i) {
        context.push("const _hoisted_" + (i + 1) + " = ");
        genNode(exp, context);
        context.newline();
    });
}
function isText(n) {
    return (shared_1.isString(n) ||
        n.type === 4 ||
        n.type === 2 ||
        n.type === 5 ||
        n.type === 8);
}
function genNodeListAsArray(nodes, context) {
    var multilines = nodes.length > 3 ||
        ((!__BROWSER__ || true) && nodes.some(function (n) { return shared_1.isArray(n) || !isText(n); }));
    context.push("[");
    multilines && context.indent();
    genNodeList(nodes, context, multilines);
    multilines && context.deindent();
    context.push("]");
}
function genNodeList(nodes, context, multilines) {
    if (multilines === void 0) { multilines = false; }
    var push = context.push, newline = context.newline;
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (shared_1.isString(node)) {
            push(node);
        }
        else if (shared_1.isArray(node)) {
            genNodeListAsArray(node, context);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            if (multilines) {
                push(',');
                newline();
            }
            else {
                push(', ');
            }
        }
    }
}
function genNode(node, context) {
    if (shared_1.isString(node)) {
        context.push(node);
        return;
    }
    if (shared_1.isSymbol(node)) {
        context.push(context.helper(node));
        return;
    }
    switch (node.type) {
        case 1:
        case 9:
        case 11:
            true &&
                utils_1.assert(node.codegenNode != null, "Codegen node is missing for element/if/for node. " +
                    "Apply appropriate transforms first.");
            genNode(node.codegenNode, context);
            break;
        case 2:
            genText(node, context);
            break;
        case 4:
            genExpression(node, context);
            break;
        case 5:
            genInterpolation(node, context);
            break;
        case 12:
            genNode(node.codegenNode, context);
            break;
        case 8:
            genCompoundExpression(node, context);
            break;
        case 3:
            genComment(node, context);
            break;
        case 13:
            genCallExpression(node, context);
            break;
        case 14:
            genObjectExpression(node, context);
            break;
        case 16:
            genArrayExpression(node, context);
            break;
        case 17:
            genFunctionExpression(node, context);
            break;
        case 18:
            genSequenceExpression(node, context);
            break;
        case 19:
            genConditionalExpression(node, context);
            break;
        case 20:
            genCacheExpression(node, context);
            break;
        default:
            if (true) {
                utils_1.assert(false, "unhandled codegen node type: " + node.type);
                var exhaustiveCheck = node;
                return exhaustiveCheck;
            }
    }
}
function genText(node, context) {
    context.push(JSON.stringify(node.content), node);
}
function genExpression(node, context) {
    var content = node.content, isStatic = node.isStatic;
    context.push(isStatic ? JSON.stringify(content) : content, node);
}
function genInterpolation(node, context) {
    var push = context.push, helper = context.helper;
    push(helper(runtimeHelpers_1.TO_STRING) + "(");
    genNode(node.content, context);
    push(")");
}
function genCompoundExpression(node, context) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
        if (shared_1.isString(child)) {
            context.push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genExpressionAsPropertyKey(node, context) {
    var push = context.push;
    if (node.type === 8) {
        push("[");
        genCompoundExpression(node, context);
        push("]");
    }
    else if (node.isStatic) {
        var text = utils_1.isSimpleIdentifier(node.content)
            ? node.content
            : JSON.stringify(node.content);
        push(text, node);
    }
    else {
        push("[" + node.content + "]", node);
    }
}
function genComment(node, context) {
    if (true) {
        var push = context.push, helper = context.helper;
        push(helper(runtimeHelpers_1.CREATE_COMMENT) + "(" + JSON.stringify(node.content) + ")", node);
    }
}
function genCallExpression(node, context) {
    var callee = shared_1.isString(node.callee)
        ? node.callee
        : context.helper(node.callee);
    context.push(callee + "(", node, true);
    genNodeList(node.arguments, context);
    context.push(")");
}
function genObjectExpression(node, context) {
    var push = context.push, indent = context.indent, deindent = context.deindent, newline = context.newline, resetMapping = context.resetMapping;
    var properties = node.properties;
    if (!properties.length) {
        push("{}", node);
        return;
    }
    var multilines = properties.length > 1 ||
        ((!true || true) &&
            properties.some(function (p) { return p.value.type !== 4; }));
    push(multilines ? "{" : "{ ");
    multilines && indent();
    for (var i = 0; i < properties.length; i++) {
        var _a = properties[i], key = _a.key, value = _a.value, loc = _a.loc;
        resetMapping(loc);
        genExpressionAsPropertyKey(key, context);
        push(": ");
        genNode(value, context);
        if (i < properties.length - 1) {
            push(",");
            newline();
        }
    }
    multilines && deindent();
    var lastChar = context.code[context.code.length - 1];
    push(multilines || /[\])}]/.test(lastChar) ? "}" : " }");
}
function genArrayExpression(node, context) {
    genNodeListAsArray(node.elements, context);
}
function genFunctionExpression(node, context) {
    var push = context.push, indent = context.indent, deindent = context.deindent;
    var params = node.params, returns = node.returns, newline = node.newline;
    push("(", node);
    if (shared_1.isArray(params)) {
        genNodeList(params, context);
    }
    else if (params) {
        genNode(params, context);
    }
    push(") => ");
    if (newline) {
        push("{");
        indent();
        push("return ");
    }
    if (shared_1.isArray(returns)) {
        genNodeListAsArray(returns, context);
    }
    else {
        genNode(returns, context);
    }
    if (newline) {
        deindent();
        push("}");
    }
}
function genConditionalExpression(node, context) {
    var test = node.test, consequent = node.consequent, alternate = node.alternate;
    var push = context.push, indent = context.indent, deindent = context.deindent, newline = context.newline;
    if (test.type === 4) {
        var needsParens = !utils_1.isSimpleIdentifier(test.content);
        needsParens && push("(");
        genExpression(test, context);
        needsParens && push(")");
    }
    else {
        push("(");
        genCompoundExpression(test, context);
        push(")");
    }
    indent();
    context.indentLevel++;
    push("? ");
    genNode(consequent, context);
    context.indentLevel--;
    newline();
    push(": ");
    var isNested = alternate.type === 19;
    if (!isNested) {
        context.indentLevel++;
    }
    genNode(alternate, context);
    if (!isNested) {
        context.indentLevel--;
    }
    deindent(true);
}
function genSequenceExpression(node, context) {
    context.push("(");
    genNodeList(node.expressions, context);
    context.push(")");
}
function genCacheExpression(node, context) {
    var push = context.push, helper = context.helper, indent = context.indent, deindent = context.deindent, newline = context.newline;
    push("_cache[" + node.index + "] || (");
    if (node.isVNode) {
        indent();
        push(helper(runtimeHelpers_1.SET_BLOCK_TRACKING) + "(-1),");
        newline();
    }
    push("_cache[" + node.index + "] = ");
    genNode(node.value, context);
    if (node.isVNode) {
        push(",");
        newline();
        push(helper(runtimeHelpers_1.SET_BLOCK_TRACKING) + "(1),");
        newline();
        push("_cache[" + node.index + "]");
        deindent();
    }
    push(")");
}
