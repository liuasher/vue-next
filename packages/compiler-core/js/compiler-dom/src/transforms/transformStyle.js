"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var compiler_core_1 = require("@vue/compiler-core");
exports.transformStyle = function (node, context) {
    if (node.type === compiler_core_1.NodeTypes.ELEMENT) {
        node.props.forEach(function (p, i) {
            if (p.type === compiler_core_1.NodeTypes.ATTRIBUTE && p.name === 'style' && p.value) {
                var parsed = JSON.stringify(parseInlineCSS(p.value.content));
                var exp = context.hoist(compiler_core_1.createSimpleExpression(parsed, false, p.loc));
                node.props[i] = {
                    type: compiler_core_1.NodeTypes.DIRECTIVE,
                    name: "bind",
                    arg: compiler_core_1.createSimpleExpression("style", true, p.loc),
                    exp: exp,
                    modifiers: [],
                    loc: p.loc
                };
            }
        });
    }
};
var listDelimiterRE = /;(?![^(]*\))/g;
var propertyDelimiterRE = /:(.+)/;
function parseInlineCSS(cssText) {
    var res = {};
    cssText.split(listDelimiterRE).forEach(function (item) {
        if (item) {
            var tmp = item.split(propertyDelimiterRE);
            tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
        }
    });
    return res;
}
