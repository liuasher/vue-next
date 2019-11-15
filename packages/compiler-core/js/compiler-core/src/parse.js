"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var shared_1 = require("../../shared/js/index");
var errors_1 = require("./errors");
var utils_1 = require("./utils");
var shared_2 = require("../../shared/js/index");
exports.defaultParserOptions = {
    delimiters: ["{{", "}}"],
    getNamespace: function () { return 0; },
    getTextMode: function () { return 0; },
    isVoidTag: shared_1.NO,
    isPreTag: shared_1.NO,
    isCustomElement: shared_1.NO,
    namedCharacterReferences: {
        'gt;': '>',
        'lt;': '<',
        'amp;': '&',
        'apos;': "'",
        'quot;': '"'
    },
    onError: errors_1.defaultOnError
};
function parse(content, options) {
    if (options === void 0) { options = {}; }
    var context = createParserContext(content, options);
    var start = getCursor(context);
    return {
        type: 0,
        children: parseChildren(context, 0, []),
        helpers: [],
        components: [],
        directives: [],
        hoists: [],
        cached: 0,
        codegenNode: undefined,
        loc: getSelection(context, start)
    };
}
exports.parse = parse;
function createParserContext(content, options) {
    return {
        options: __assign(__assign({}, exports.defaultParserOptions), options),
        column: 1,
        line: 1,
        offset: 0,
        originalSource: content,
        source: content,
        maxCRNameLength: Object.keys(options.namedCharacterReferences ||
            exports.defaultParserOptions.namedCharacterReferences).reduce(function (max, name) { return Math.max(max, name.length); }, 0),
        inPre: false
    };
}
function parseChildren(context, mode, ancestors) {
    var parent = last(ancestors);
    var ns = parent ? parent.ns : 0;
    var nodes = [];
    while (!isEnd(context, mode, ancestors)) {
        __DEV__ && utils_1.assert(context.source.length > 0);
        var s = context.source;
        var node = undefined;
        if (!context.inPre && startsWith(s, context.options.delimiters[0])) {
            node = parseInterpolation(context, mode);
        }
        else if (mode === 0 && s[0] === '<') {
            if (s.length === 1) {
                emitError(context, 8, 1);
            }
            else if (s[1] === '!') {
                if (startsWith(s, '<!--')) {
                    node = parseComment(context);
                }
                else if (startsWith(s, '<!DOCTYPE')) {
                    node = parseBogusComment(context);
                }
                else if (startsWith(s, '<![CDATA[')) {
                    if (ns !== 0) {
                        node = parseCDATA(context, ancestors);
                    }
                    else {
                        emitError(context, 2);
                        node = parseBogusComment(context);
                    }
                }
                else {
                    emitError(context, 14);
                    node = parseBogusComment(context);
                }
            }
            else if (s[1] === '/') {
                if (s.length === 2) {
                    emitError(context, 8, 2);
                }
                else if (s[2] === '>') {
                    emitError(context, 17, 2);
                    advanceBy(context, 3);
                    continue;
                }
                else if (/[a-z]/i.test(s[2])) {
                    emitError(context, 31);
                    parseTag(context, 1, parent);
                    continue;
                }
                else {
                    emitError(context, 15, 2);
                    node = parseBogusComment(context);
                }
            }
            else if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
            else if (s[1] === '?') {
                emitError(context, 28, 1);
                node = parseBogusComment(context);
            }
            else {
                emitError(context, 15, 1);
            }
        }
        if (!node) {
            node = parseText(context, mode);
        }
        if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                pushNode(nodes, node[i]);
            }
        }
        else {
            pushNode(nodes, node);
        }
    }
    var removedWhitespace = false;
    if (!parent || !context.options.isPreTag(parent.tag)) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.type === 2) {
                if (!node.content.trim()) {
                    var prev = nodes[i - 1];
                    var next = nodes[i + 1];
                    if (!prev ||
                        !next ||
                        prev.type === 3 ||
                        next.type === 3 ||
                        (prev.type === 1 &&
                            next.type === 1 &&
                            /[\r\n]/.test(node.content))) {
                        removedWhitespace = true;
                        nodes[i] = null;
                    }
                    else {
                        node.content = ' ';
                    }
                }
                else {
                    node.content = node.content.replace(/\s+/g, ' ');
                }
            }
        }
    }
    return removedWhitespace ? nodes.filter(function (node) { return node !== null; }) : nodes;
}
function pushNode(nodes, node) {
    if (!__DEV__ && node.type === 3) {
        return;
    }
    if (node.type === 2) {
        var prev = last(nodes);
        if (prev &&
            prev.type === 2 &&
            prev.loc.end.offset === node.loc.start.offset) {
            prev.content += node.content;
            prev.loc.end = node.loc.end;
            prev.loc.source += node.loc.source;
            return;
        }
    }
    nodes.push(node);
}
function parseCDATA(context, ancestors) {
    __DEV__ &&
        utils_1.assert(last(ancestors) == null || last(ancestors).ns !== 0);
    __DEV__ && utils_1.assert(startsWith(context.source, '<![CDATA['));
    advanceBy(context, 9);
    var nodes = parseChildren(context, 3, ancestors);
    if (context.source.length === 0) {
        emitError(context, 9);
    }
    else {
        __DEV__ && utils_1.assert(startsWith(context.source, ']]>'));
        advanceBy(context, 3);
    }
    return nodes;
}
function parseComment(context) {
    __DEV__ && utils_1.assert(startsWith(context.source, '<!--'));
    var start = getCursor(context);
    var content;
    var match = /--(\!)?>/.exec(context.source);
    if (!match) {
        content = context.source.slice(4);
        advanceBy(context, context.source.length);
        emitError(context, 10);
    }
    else {
        if (match.index <= 3) {
            emitError(context, 0);
        }
        if (match[1]) {
            emitError(context, 13);
        }
        content = context.source.slice(4, match.index);
        var s = context.source.slice(0, match.index);
        var prevIndex = 1, nestedIndex = 0;
        while ((nestedIndex = s.indexOf('<!--', prevIndex)) !== -1) {
            advanceBy(context, nestedIndex - prevIndex + 1);
            if (nestedIndex + 4 < s.length) {
                emitError(context, 20);
            }
            prevIndex = nestedIndex + 1;
        }
        advanceBy(context, match.index + match[0].length - prevIndex + 1);
    }
    return {
        type: 3,
        content: content,
        loc: getSelection(context, start)
    };
}
function parseBogusComment(context) {
    __DEV__ && utils_1.assert(/^<(?:[\!\?]|\/[^a-z>])/i.test(context.source));
    var start = getCursor(context);
    var contentStart = context.source[1] === '?' ? 1 : 2;
    var content;
    var closeIndex = context.source.indexOf('>');
    if (closeIndex === -1) {
        content = context.source.slice(contentStart);
        advanceBy(context, context.source.length);
    }
    else {
        content = context.source.slice(contentStart, closeIndex);
        advanceBy(context, closeIndex + 1);
    }
    return {
        type: 3,
        content: content,
        loc: getSelection(context, start)
    };
}
function parseElement(context, ancestors) {
    __DEV__ && utils_1.assert(/^<[a-z]/i.test(context.source));
    var wasInPre = context.inPre;
    var parent = last(ancestors);
    var element = parseTag(context, 0, parent);
    var isPreBoundary = context.inPre && !wasInPre;
    if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
        return element;
    }
    ancestors.push(element);
    var mode = context.options.getTextMode(element.tag, element.ns);
    var children = parseChildren(context, mode, ancestors);
    ancestors.pop();
    element.children = children;
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1, parent);
    }
    else {
        emitError(context, 32);
        if (context.source.length === 0 && element.tag.toLowerCase() === 'script') {
            var first = children[0];
            if (first && startsWith(first.loc.source, '<!--')) {
                emitError(context, 11);
            }
        }
    }
    element.loc = getSelection(context, element.loc.start);
    if (isPreBoundary) {
        context.inPre = false;
    }
    return element;
}
function parseTag(context, type, parent) {
    __DEV__ && utils_1.assert(/^<\/?[a-z]/i.test(context.source));
    __DEV__ &&
        utils_1.assert(type === (startsWith(context.source, '</') ? 1 : 0));
    var start = getCursor(context);
    var match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
    var tag = match[1];
    var ns = context.options.getNamespace(tag, parent);
    advanceBy(context, match[0].length);
    advanceSpaces(context);
    var cursor = getCursor(context);
    var currentSource = context.source;
    var props = parseAttributes(context, type);
    if (!context.inPre &&
        props.some(function (p) { return p.type === 7 && p.name === 'pre'; })) {
        context.inPre = true;
        shared_2.extend(context, cursor);
        context.source = currentSource;
        props = parseAttributes(context, type).filter(function (p) { return p.name !== 'v-pre'; });
    }
    var isSelfClosing = false;
    if (context.source.length === 0) {
        emitError(context, 12);
    }
    else {
        isSelfClosing = startsWith(context.source, '/>');
        if (type === 1 && isSelfClosing) {
            emitError(context, 7);
        }
        advanceBy(context, isSelfClosing ? 2 : 1);
    }
    var tagType = 0;
    if (!context.inPre && !context.options.isCustomElement(tag)) {
        if (context.options.isNativeTag) {
            if (!context.options.isNativeTag(tag))
                tagType = 1;
        }
        else {
            if (/^[A-Z]/.test(tag))
                tagType = 1;
        }
        if (tag === 'slot')
            tagType = 2;
        else if (tag === 'template')
            tagType = 3;
        else if (tag === 'portal' || tag === 'Portal')
            tagType = 4;
        else if (tag === 'suspense' || tag === 'Suspense')
            tagType = 5;
    }
    return {
        type: 1,
        ns: ns,
        tag: tag,
        tagType: tagType,
        props: props,
        isSelfClosing: isSelfClosing,
        children: [],
        loc: getSelection(context, start),
        codegenNode: undefined
    };
}
function parseAttributes(context, type) {
    var props = [];
    var attributeNames = new Set();
    while (context.source.length > 0 &&
        !startsWith(context.source, '>') &&
        !startsWith(context.source, '/>')) {
        if (startsWith(context.source, '/')) {
            emitError(context, 29);
            advanceBy(context, 1);
            advanceSpaces(context);
            continue;
        }
        if (type === 1) {
            emitError(context, 6);
        }
        var attr = parseAttribute(context, attributeNames);
        if (type === 0) {
            props.push(attr);
        }
        if (/^[^\t\r\n\f />]/.test(context.source)) {
            emitError(context, 19);
        }
        advanceSpaces(context);
    }
    return props;
}
function parseAttribute(context, nameSet) {
    __DEV__ && utils_1.assert(/^[^\t\r\n\f />]/.test(context.source));
    var start = getCursor(context);
    var match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    var name = match[0];
    if (nameSet.has(name)) {
        emitError(context, 5);
    }
    nameSet.add(name);
    if (name[0] === '=') {
        emitError(context, 26);
    }
    {
        var pattern = /["'<]/g;
        var m = void 0;
        while ((m = pattern.exec(name)) !== null) {
            emitError(context, 24, m.index);
        }
    }
    advanceBy(context, name.length);
    var value = undefined;
    if (/^[\t\r\n\f ]*=/.test(context.source)) {
        advanceSpaces(context);
        advanceBy(context, 1);
        advanceSpaces(context);
        value = parseAttributeValue(context);
        if (!value) {
            emitError(context, 16);
        }
    }
    var loc = getSelection(context, start);
    if (!context.inPre && /^(v-|:|@|#)/.test(name)) {
        var match_1 = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)([^\.]+))?(.+)?$/i.exec(name);
        var arg = void 0;
        if (match_1[2]) {
            var startOffset = name.split(match_1[2], 2).shift().length;
            var loc_1 = getSelection(context, getNewPosition(context, start, startOffset), getNewPosition(context, start, startOffset + match_1[2].length));
            var content = match_1[2];
            var isStatic = true;
            if (content.startsWith('[')) {
                isStatic = false;
                if (!content.endsWith(']')) {
                    emitError(context, 34);
                }
                content = content.substr(1, content.length - 2);
            }
            arg = {
                type: 4,
                content: content,
                isStatic: isStatic,
                isConstant: isStatic,
                loc: loc_1
            };
        }
        if (value && value.isQuoted) {
            var valueLoc = value.loc;
            valueLoc.start.offset++;
            valueLoc.start.column++;
            valueLoc.end = utils_1.advancePositionWithClone(valueLoc.start, value.content);
            valueLoc.source = valueLoc.source.slice(1, -1);
        }
        return {
            type: 7,
            name: match_1[1] ||
                (startsWith(name, ':')
                    ? 'bind'
                    : startsWith(name, '@')
                        ? 'on'
                        : 'slot'),
            exp: value && {
                type: 4,
                content: value.content,
                isStatic: false,
                isConstant: false,
                loc: value.loc
            },
            arg: arg,
            modifiers: match_1[3] ? match_1[3].substr(1).split('.') : [],
            loc: loc
        };
    }
    return {
        type: 6,
        name: name,
        value: value && {
            type: 2,
            content: value.content,
            loc: value.loc
        },
        loc: loc
    };
}
function parseAttributeValue(context) {
    var start = getCursor(context);
    var content;
    var quote = context.source[0];
    var isQuoted = quote === "\"" || quote === "'";
    if (isQuoted) {
        advanceBy(context, 1);
        var endIndex = context.source.indexOf(quote);
        if (endIndex === -1) {
            content = parseTextData(context, context.source.length, 4);
        }
        else {
            content = parseTextData(context, endIndex, 4);
            advanceBy(context, 1);
        }
    }
    else {
        var match = /^[^\t\r\n\f >]+/.exec(context.source);
        if (!match) {
            return undefined;
        }
        var unexpectedChars = /["'<=`]/g;
        var m = void 0;
        while ((m = unexpectedChars.exec(match[0])) !== null) {
            emitError(context, 25, m.index);
        }
        content = parseTextData(context, match[0].length, 4);
    }
    return { content: content, isQuoted: isQuoted, loc: getSelection(context, start) };
}
function parseInterpolation(context, mode) {
    var _a = context.options.delimiters, open = _a[0], close = _a[1];
    __DEV__ && utils_1.assert(startsWith(context.source, open));
    var closeIndex = context.source.indexOf(close, open.length);
    if (closeIndex === -1) {
        emitError(context, 33);
        return undefined;
    }
    var start = getCursor(context);
    advanceBy(context, open.length);
    var innerStart = getCursor(context);
    var innerEnd = getCursor(context);
    var rawContentLength = closeIndex - open.length;
    var rawContent = context.source.slice(0, rawContentLength);
    var preTrimContent = parseTextData(context, rawContentLength, mode);
    var content = preTrimContent.trim();
    var startOffset = preTrimContent.indexOf(content);
    if (startOffset > 0) {
        utils_1.advancePositionWithMutation(innerStart, rawContent, startOffset);
    }
    var endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
    utils_1.advancePositionWithMutation(innerEnd, rawContent, endOffset);
    advanceBy(context, close.length);
    return {
        type: 5,
        content: {
            type: 4,
            isStatic: false,
            isConstant: false,
            content: content,
            loc: getSelection(context, innerStart, innerEnd)
        },
        loc: getSelection(context, start)
    };
}
function parseText(context, mode) {
    __DEV__ && utils_1.assert(context.source.length > 0);
    var open = context.options.delimiters[0];
    var endIndex = Math.min.apply(Math, [
        context.source.indexOf('<', 1),
        context.source.indexOf(open, 1),
        mode === 3 ? context.source.indexOf(']]>') : -1,
        context.source.length
    ].filter(function (n) { return n !== -1; }));
    __DEV__ && utils_1.assert(endIndex > 0);
    var start = getCursor(context);
    var content = parseTextData(context, endIndex, mode);
    return {
        type: 2,
        content: content,
        loc: getSelection(context, start)
    };
}
function parseTextData(context, length, mode) {
    if (mode === 2 || mode === 3) {
        var text_1 = context.source.slice(0, length);
        advanceBy(context, length);
        return text_1;
    }
    var end = context.offset + length;
    var text = '';
    while (context.offset < end) {
        var head = /&(?:#x?)?/i.exec(context.source);
        if (!head || context.offset + head.index >= end) {
            var remaining = end - context.offset;
            text += context.source.slice(0, remaining);
            advanceBy(context, remaining);
            break;
        }
        text += context.source.slice(0, head.index);
        advanceBy(context, head.index);
        if (head[0] === '&') {
            var name_1 = '', value = undefined;
            if (/[0-9a-z]/i.test(context.source[1])) {
                for (var length_1 = context.maxCRNameLength; !value && length_1 > 0; --length_1) {
                    name_1 = context.source.substr(1, length_1);
                    value = context.options.namedCharacterReferences[name_1];
                }
                if (value) {
                    var semi = name_1.endsWith(';');
                    if (mode === 4 &&
                        !semi &&
                        /[=a-z0-9]/i.test(context.source[1 + name_1.length] || '')) {
                        text += '&';
                        text += name_1;
                        advanceBy(context, 1 + name_1.length);
                    }
                    else {
                        text += value;
                        advanceBy(context, 1 + name_1.length);
                        if (!semi) {
                            emitError(context, 18);
                        }
                    }
                }
                else {
                    emitError(context, 30);
                    text += '&';
                    text += name_1;
                    advanceBy(context, 1 + name_1.length);
                }
            }
            else {
                text += '&';
                advanceBy(context, 1);
            }
        }
        else {
            var hex = head[0] === '&#x';
            var pattern = hex ? /^&#x([0-9a-f]+);?/i : /^&#([0-9]+);?/;
            var body = pattern.exec(context.source);
            if (!body) {
                text += head[0];
                emitError(context, 1);
                advanceBy(context, head[0].length);
            }
            else {
                var cp = Number.parseInt(body[1], hex ? 16 : 10);
                if (cp === 0) {
                    emitError(context, 22);
                    cp = 0xfffd;
                }
                else if (cp > 0x10ffff) {
                    emitError(context, 3);
                    cp = 0xfffd;
                }
                else if (cp >= 0xd800 && cp <= 0xdfff) {
                    emitError(context, 23);
                    cp = 0xfffd;
                }
                else if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) {
                    emitError(context, 21);
                }
                else if ((cp >= 0x01 && cp <= 0x08) ||
                    cp === 0x0b ||
                    (cp >= 0x0d && cp <= 0x1f) ||
                    (cp >= 0x7f && cp <= 0x9f)) {
                    emitError(context, 4);
                    cp = CCR_REPLACEMENTS[cp] || cp;
                }
                text += String.fromCodePoint(cp);
                advanceBy(context, body[0].length);
                if (!body[0].endsWith(';')) {
                    emitError(context, 18);
                }
            }
        }
    }
    return text;
}
function getCursor(context) {
    var column = context.column, line = context.line, offset = context.offset;
    return { column: column, line: line, offset: offset };
}
function getSelection(context, start, end) {
    end = end || getCursor(context);
    return {
        start: start,
        end: end,
        source: context.originalSource.slice(start.offset, end.offset)
    };
}
function last(xs) {
    return xs[xs.length - 1];
}
function startsWith(source, searchString) {
    return source.startsWith(searchString);
}
function advanceBy(context, numberOfCharacters) {
    var source = context.source;
    __DEV__ && utils_1.assert(numberOfCharacters <= source.length);
    utils_1.advancePositionWithMutation(context, source, numberOfCharacters);
    context.source = source.slice(numberOfCharacters);
}
function advanceSpaces(context) {
    var match = /^[\t\r\n\f ]+/.exec(context.source);
    if (match) {
        advanceBy(context, match[0].length);
    }
}
function getNewPosition(context, start, numberOfCharacters) {
    return utils_1.advancePositionWithClone(start, context.originalSource.slice(start.offset, numberOfCharacters), numberOfCharacters);
}
function emitError(context, code, offset) {
    var loc = getCursor(context);
    if (offset) {
        loc.offset += offset;
        loc.column += offset;
    }
    context.options.onError(errors_1.createCompilerError(code, {
        start: loc,
        end: loc,
        source: ''
    }));
}
function isEnd(context, mode, ancestors) {
    var s = context.source;
    switch (mode) {
        case 0:
            if (startsWith(s, '</')) {
                for (var i = ancestors.length - 1; i >= 0; --i) {
                    if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                        return true;
                    }
                }
            }
            break;
        case 1:
        case 2: {
            var parent_1 = last(ancestors);
            if (parent_1 && startsWithEndTagOpen(s, parent_1.tag)) {
                return true;
            }
            break;
        }
        case 3:
            if (startsWith(s, ']]>')) {
                return true;
            }
            break;
    }
    return !s;
}
function startsWithEndTagOpen(source, tag) {
    return (startsWith(source, '</') &&
        source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
        /[\t\n\f />]/.test(source[2 + tag.length] || '>'));
}
var CCR_REPLACEMENTS = {
    0x80: 0x20ac,
    0x82: 0x201a,
    0x83: 0x0192,
    0x84: 0x201e,
    0x85: 0x2026,
    0x86: 0x2020,
    0x87: 0x2021,
    0x88: 0x02c6,
    0x89: 0x2030,
    0x8a: 0x0160,
    0x8b: 0x2039,
    0x8c: 0x0152,
    0x8e: 0x017d,
    0x91: 0x2018,
    0x92: 0x2019,
    0x93: 0x201c,
    0x94: 0x201d,
    0x95: 0x2022,
    0x96: 0x2013,
    0x97: 0x2014,
    0x98: 0x02dc,
    0x99: 0x2122,
    0x9a: 0x0161,
    0x9b: 0x203a,
    0x9c: 0x0153,
    0x9e: 0x017e,
    0x9f: 0x0178
};
