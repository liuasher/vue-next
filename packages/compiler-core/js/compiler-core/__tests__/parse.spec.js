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
var parse_1 = require("../src/parse");
describe('compiler: parse', function () {
    describe('Text', function () {
        test('simple text', function () {
            var ast = parse_1.parse('some text');
            var text = ast.children[0];
            expect(text).toStrictEqual({
                type: 2,
                content: 'some text',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 9, line: 1, column: 10 },
                    source: 'some text'
                }
            });
        });
        test('simple text with invalid end tag', function () {
            var ast = parse_1.parse('some text</div>', {
                onError: function () { }
            });
            var text = ast.children[0];
            expect(text).toStrictEqual({
                type: 2,
                content: 'some text',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 9, line: 1, column: 10 },
                    source: 'some text'
                }
            });
        });
        test('text with interpolation', function () {
            var ast = parse_1.parse('some {{ foo + bar }} text');
            var text1 = ast.children[0];
            var text2 = ast.children[2];
            expect(text1).toStrictEqual({
                type: 2,
                content: 'some ',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 5, line: 1, column: 6 },
                    source: 'some '
                }
            });
            expect(text2).toStrictEqual({
                type: 2,
                content: ' text',
                loc: {
                    start: { offset: 20, line: 1, column: 21 },
                    end: { offset: 25, line: 1, column: 26 },
                    source: ' text'
                }
            });
        });
        test('text with interpolation which has `<`', function () {
            var ast = parse_1.parse('some {{ a<b && c>d }} text');
            var text1 = ast.children[0];
            var text2 = ast.children[2];
            expect(text1).toStrictEqual({
                type: 2,
                content: 'some ',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 5, line: 1, column: 6 },
                    source: 'some '
                }
            });
            expect(text2).toStrictEqual({
                type: 2,
                content: ' text',
                loc: {
                    start: { offset: 21, line: 1, column: 22 },
                    end: { offset: 26, line: 1, column: 27 },
                    source: ' text'
                }
            });
        });
        test('text with mix of tags and interpolations', function () {
            var ast = parse_1.parse('some <span>{{ foo < bar + foo }} text</span>');
            var text1 = ast.children[0];
            var text2 = ast.children[1].children[1];
            expect(text1).toStrictEqual({
                type: 2,
                content: 'some ',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 5, line: 1, column: 6 },
                    source: 'some '
                }
            });
            expect(text2).toStrictEqual({
                type: 2,
                content: ' text',
                loc: {
                    start: { offset: 32, line: 1, column: 33 },
                    end: { offset: 37, line: 1, column: 38 },
                    source: ' text'
                }
            });
        });
        test('lonly "<" don\'t separate nodes', function () {
            var ast = parse_1.parse('a < b', {
                onError: function (err) {
                    if (err.code !== 15) {
                        throw err;
                    }
                }
            });
            var text = ast.children[0];
            expect(text).toStrictEqual({
                type: 2,
                content: 'a < b',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 5, line: 1, column: 6 },
                    source: 'a < b'
                }
            });
        });
        test('lonly "{{" don\'t separate nodes', function () {
            var ast = parse_1.parse('a {{ b', {
                onError: function (error) {
                    if (error.code !== 33) {
                        throw error;
                    }
                }
            });
            var text = ast.children[0];
            expect(text).toStrictEqual({
                type: 2,
                content: 'a {{ b',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 6, line: 1, column: 7 },
                    source: 'a {{ b'
                }
            });
        });
        test('HTML entities compatibility in text (https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state).', function () {
            var spy = jest.fn();
            var ast = parse_1.parse('&ampersand;', {
                namedCharacterReferences: { amp: '&' },
                onError: spy
            });
            var text = ast.children[0];
            expect(text).toStrictEqual({
                type: 2,
                content: '&ersand;',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 11, line: 1, column: 12 },
                    source: '&ampersand;'
                }
            });
            expect(spy.mock.calls).toMatchObject([
                [
                    {
                        code: 18,
                        loc: {
                            start: { offset: 4, line: 1, column: 5 }
                        }
                    }
                ]
            ]);
        });
        test('HTML entities compatibility in attribute (https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state).', function () {
            var spy = jest.fn();
            var ast = parse_1.parse('<div a="&ampersand;" b="&amp;ersand;" c="&amp!"></div>', {
                namedCharacterReferences: { amp: '&', 'amp;': '&' },
                onError: spy
            });
            var element = ast.children[0];
            var text1 = element.props[0].value;
            var text2 = element.props[1].value;
            var text3 = element.props[2].value;
            expect(text1).toStrictEqual({
                type: 2,
                content: '&ampersand;',
                loc: {
                    start: { offset: 7, line: 1, column: 8 },
                    end: { offset: 20, line: 1, column: 21 },
                    source: '"&ampersand;"'
                }
            });
            expect(text2).toStrictEqual({
                type: 2,
                content: '&ersand;',
                loc: {
                    start: { offset: 23, line: 1, column: 24 },
                    end: { offset: 37, line: 1, column: 38 },
                    source: '"&amp;ersand;"'
                }
            });
            expect(text3).toStrictEqual({
                type: 2,
                content: '&!',
                loc: {
                    start: { offset: 40, line: 1, column: 41 },
                    end: { offset: 47, line: 1, column: 48 },
                    source: '"&amp!"'
                }
            });
            expect(spy.mock.calls).toMatchObject([
                [
                    {
                        code: 18,
                        loc: {
                            start: { offset: 45, line: 1, column: 46 }
                        }
                    }
                ]
            ]);
        });
        test('Some control character reference should be replaced.', function () {
            var spy = jest.fn();
            var ast = parse_1.parse('&#x86;', { onError: spy });
            var text = ast.children[0];
            expect(text).toStrictEqual({
                type: 2,
                content: '†',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 6, line: 1, column: 7 },
                    source: '&#x86;'
                }
            });
            expect(spy.mock.calls).toMatchObject([
                [
                    {
                        code: 4,
                        loc: {
                            start: { offset: 0, line: 1, column: 1 }
                        }
                    }
                ]
            ]);
        });
    });
    describe('Interpolation', function () {
        test('simple interpolation', function () {
            var ast = parse_1.parse('{{message}}');
            var interpolation = ast.children[0];
            expect(interpolation).toStrictEqual({
                type: 5,
                content: {
                    type: 4,
                    content: "message",
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 2, line: 1, column: 3 },
                        end: { offset: 9, line: 1, column: 10 },
                        source: "message"
                    }
                },
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 11, line: 1, column: 12 },
                    source: '{{message}}'
                }
            });
        });
        test('it can have tag-like notation', function () {
            var ast = parse_1.parse('{{ a<b }}');
            var interpolation = ast.children[0];
            expect(interpolation).toStrictEqual({
                type: 5,
                content: {
                    type: 4,
                    content: "a<b",
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 3, line: 1, column: 4 },
                        end: { offset: 6, line: 1, column: 7 },
                        source: 'a<b'
                    }
                },
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 9, line: 1, column: 10 },
                    source: '{{ a<b }}'
                }
            });
        });
        test('it can have tag-like notation (2)', function () {
            var ast = parse_1.parse('{{ a<b }}{{ c>d }}');
            var interpolation1 = ast.children[0];
            var interpolation2 = ast.children[1];
            expect(interpolation1).toStrictEqual({
                type: 5,
                content: {
                    type: 4,
                    content: "a<b",
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 3, line: 1, column: 4 },
                        end: { offset: 6, line: 1, column: 7 },
                        source: 'a<b'
                    }
                },
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 9, line: 1, column: 10 },
                    source: '{{ a<b }}'
                }
            });
            expect(interpolation2).toStrictEqual({
                type: 5,
                content: {
                    type: 4,
                    isStatic: false,
                    isConstant: false,
                    content: 'c>d',
                    loc: {
                        start: { offset: 12, line: 1, column: 13 },
                        end: { offset: 15, line: 1, column: 16 },
                        source: 'c>d'
                    }
                },
                loc: {
                    start: { offset: 9, line: 1, column: 10 },
                    end: { offset: 18, line: 1, column: 19 },
                    source: '{{ c>d }}'
                }
            });
        });
        test('it can have tag-like notation (3)', function () {
            var ast = parse_1.parse('<div>{{ "</div>" }}</div>');
            var element = ast.children[0];
            var interpolation = element.children[0];
            expect(interpolation).toStrictEqual({
                type: 5,
                content: {
                    type: 4,
                    isStatic: false,
                    isConstant: false,
                    content: '"</div>"',
                    loc: {
                        start: { offset: 8, line: 1, column: 9 },
                        end: { offset: 16, line: 1, column: 17 },
                        source: '"</div>"'
                    }
                },
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 19, line: 1, column: 20 },
                    source: '{{ "</div>" }}'
                }
            });
        });
        test('custom delimiters', function () {
            var ast = parse_1.parse('<p>{msg}</p>', {
                delimiters: ['{', '}']
            });
            var element = ast.children[0];
            var interpolation = element.children[0];
            expect(interpolation).toStrictEqual({
                type: 5,
                content: {
                    type: 4,
                    content: "msg",
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 4, line: 1, column: 5 },
                        end: { offset: 7, line: 1, column: 8 },
                        source: 'msg'
                    }
                },
                loc: {
                    start: { offset: 3, line: 1, column: 4 },
                    end: { offset: 8, line: 1, column: 9 },
                    source: '{msg}'
                }
            });
        });
    });
    describe('Comment', function () {
        test('empty comment', function () {
            var ast = parse_1.parse('<!---->');
            var comment = ast.children[0];
            expect(comment).toStrictEqual({
                type: 3,
                content: '',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 7, line: 1, column: 8 },
                    source: '<!---->'
                }
            });
        });
        test('simple comment', function () {
            var ast = parse_1.parse('<!--abc-->');
            var comment = ast.children[0];
            expect(comment).toStrictEqual({
                type: 3,
                content: 'abc',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 10, line: 1, column: 11 },
                    source: '<!--abc-->'
                }
            });
        });
        test('two comments', function () {
            var ast = parse_1.parse('<!--abc--><!--def-->');
            var comment1 = ast.children[0];
            var comment2 = ast.children[1];
            expect(comment1).toStrictEqual({
                type: 3,
                content: 'abc',
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 10, line: 1, column: 11 },
                    source: '<!--abc-->'
                }
            });
            expect(comment2).toStrictEqual({
                type: 3,
                content: 'def',
                loc: {
                    start: { offset: 10, line: 1, column: 11 },
                    end: { offset: 20, line: 1, column: 21 },
                    source: '<!--def-->'
                }
            });
        });
    });
    describe('Element', function () {
        test('simple div', function () {
            var ast = parse_1.parse('<div>hello</div>');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [],
                isSelfClosing: false,
                children: [
                    {
                        type: 2,
                        content: 'hello',
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 10, line: 1, column: 11 },
                            source: 'hello'
                        }
                    }
                ],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 16, line: 1, column: 17 },
                    source: '<div>hello</div>'
                }
            });
        });
        test('empty', function () {
            var ast = parse_1.parse('<div></div>');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 11, line: 1, column: 12 },
                    source: '<div></div>'
                }
            });
        });
        test('self closing', function () {
            var ast = parse_1.parse('<div/>after');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [],
                isSelfClosing: true,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 6, line: 1, column: 7 },
                    source: '<div/>'
                }
            });
        });
        test('void element', function () {
            var ast = parse_1.parse('<img>after', {
                isVoidTag: function (tag) { return tag === 'img'; }
            });
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'img',
                tagType: 0,
                codegenNode: undefined,
                props: [],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 5, line: 1, column: 6 },
                    source: '<img>'
                }
            });
        });
        test('native element with `isNativeTag`', function () {
            var ast = parse_1.parse('<div></div><comp></comp><Comp></Comp>', {
                isNativeTag: function (tag) { return tag === 'div'; }
            });
            expect(ast.children[0]).toMatchObject({
                type: 1,
                tag: 'div',
                tagType: 0
            });
            expect(ast.children[1]).toMatchObject({
                type: 1,
                tag: 'comp',
                tagType: 1
            });
            expect(ast.children[2]).toMatchObject({
                type: 1,
                tag: 'Comp',
                tagType: 1
            });
        });
        test('native element without `isNativeTag`', function () {
            var ast = parse_1.parse('<div></div><comp></comp><Comp></Comp>');
            expect(ast.children[0]).toMatchObject({
                type: 1,
                tag: 'div',
                tagType: 0
            });
            expect(ast.children[1]).toMatchObject({
                type: 1,
                tag: 'comp',
                tagType: 0
            });
            expect(ast.children[2]).toMatchObject({
                type: 1,
                tag: 'Comp',
                tagType: 1
            });
        });
        test('custom element', function () {
            var ast = parse_1.parse('<div></div><comp></comp>', {
                isNativeTag: function (tag) { return tag === 'div'; },
                isCustomElement: function (tag) { return tag === 'comp'; }
            });
            expect(ast.children[0]).toMatchObject({
                type: 1,
                tag: 'div',
                tagType: 0
            });
            expect(ast.children[1]).toMatchObject({
                type: 1,
                tag: 'comp',
                tagType: 0
            });
        });
        test('attribute with no value', function () {
            var ast = parse_1.parse('<div id></div>');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [
                    {
                        type: 6,
                        name: 'id',
                        value: undefined,
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 7, line: 1, column: 8 },
                            source: 'id'
                        }
                    }
                ],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 14, line: 1, column: 15 },
                    source: '<div id></div>'
                }
            });
        });
        test('attribute with empty value, double quote', function () {
            var ast = parse_1.parse('<div id=""></div>');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [
                    {
                        type: 6,
                        name: 'id',
                        value: {
                            type: 2,
                            content: '',
                            loc: {
                                start: { offset: 8, line: 1, column: 9 },
                                end: { offset: 10, line: 1, column: 11 },
                                source: '""'
                            }
                        },
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 10, line: 1, column: 11 },
                            source: 'id=""'
                        }
                    }
                ],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 17, line: 1, column: 18 },
                    source: '<div id=""></div>'
                }
            });
        });
        test('attribute with empty value, single quote', function () {
            var ast = parse_1.parse("<div id=''></div>");
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [
                    {
                        type: 6,
                        name: 'id',
                        value: {
                            type: 2,
                            content: '',
                            loc: {
                                start: { offset: 8, line: 1, column: 9 },
                                end: { offset: 10, line: 1, column: 11 },
                                source: "''"
                            }
                        },
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 10, line: 1, column: 11 },
                            source: "id=''"
                        }
                    }
                ],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 17, line: 1, column: 18 },
                    source: "<div id=''></div>"
                }
            });
        });
        test('attribute with value, double quote', function () {
            var ast = parse_1.parse('<div id=">\'"></div>');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [
                    {
                        type: 6,
                        name: 'id',
                        value: {
                            type: 2,
                            content: ">'",
                            loc: {
                                start: { offset: 8, line: 1, column: 9 },
                                end: { offset: 12, line: 1, column: 13 },
                                source: '">\'"'
                            }
                        },
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 12, line: 1, column: 13 },
                            source: 'id=">\'"'
                        }
                    }
                ],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 19, line: 1, column: 20 },
                    source: '<div id=">\'"></div>'
                }
            });
        });
        test('attribute with value, single quote', function () {
            var ast = parse_1.parse("<div id='>\"'></div>");
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [
                    {
                        type: 6,
                        name: 'id',
                        value: {
                            type: 2,
                            content: '>"',
                            loc: {
                                start: { offset: 8, line: 1, column: 9 },
                                end: { offset: 12, line: 1, column: 13 },
                                source: "'>\"'"
                            }
                        },
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 12, line: 1, column: 13 },
                            source: "id='>\"'"
                        }
                    }
                ],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 19, line: 1, column: 20 },
                    source: "<div id='>\"'></div>"
                }
            });
        });
        test('attribute with value, unquoted', function () {
            var ast = parse_1.parse('<div id=a/></div>');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [
                    {
                        type: 6,
                        name: 'id',
                        value: {
                            type: 2,
                            content: 'a/',
                            loc: {
                                start: { offset: 8, line: 1, column: 9 },
                                end: { offset: 10, line: 1, column: 11 },
                                source: 'a/'
                            }
                        },
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 10, line: 1, column: 11 },
                            source: 'id=a/'
                        }
                    }
                ],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 17, line: 1, column: 18 },
                    source: '<div id=a/></div>'
                }
            });
        });
        test('multiple attributes', function () {
            var ast = parse_1.parse('<div id=a class="c" inert style=\'\'></div>');
            var element = ast.children[0];
            expect(element).toStrictEqual({
                type: 1,
                ns: 0,
                tag: 'div',
                tagType: 0,
                codegenNode: undefined,
                props: [
                    {
                        type: 6,
                        name: 'id',
                        value: {
                            type: 2,
                            content: 'a',
                            loc: {
                                start: { offset: 8, line: 1, column: 9 },
                                end: { offset: 9, line: 1, column: 10 },
                                source: 'a'
                            }
                        },
                        loc: {
                            start: { offset: 5, line: 1, column: 6 },
                            end: { offset: 9, line: 1, column: 10 },
                            source: 'id=a'
                        }
                    },
                    {
                        type: 6,
                        name: 'class',
                        value: {
                            type: 2,
                            content: 'c',
                            loc: {
                                start: { offset: 16, line: 1, column: 17 },
                                end: { offset: 19, line: 1, column: 20 },
                                source: '"c"'
                            }
                        },
                        loc: {
                            start: { offset: 10, line: 1, column: 11 },
                            end: { offset: 19, line: 1, column: 20 },
                            source: 'class="c"'
                        }
                    },
                    {
                        type: 6,
                        name: 'inert',
                        value: undefined,
                        loc: {
                            start: { offset: 20, line: 1, column: 21 },
                            end: { offset: 25, line: 1, column: 26 },
                            source: 'inert'
                        }
                    },
                    {
                        type: 6,
                        name: 'style',
                        value: {
                            type: 2,
                            content: '',
                            loc: {
                                start: { offset: 32, line: 1, column: 33 },
                                end: { offset: 34, line: 1, column: 35 },
                                source: "''"
                            }
                        },
                        loc: {
                            start: { offset: 26, line: 1, column: 27 },
                            end: { offset: 34, line: 1, column: 35 },
                            source: "style=''"
                        }
                    }
                ],
                isSelfClosing: false,
                children: [],
                loc: {
                    start: { offset: 0, line: 1, column: 1 },
                    end: { offset: 41, line: 1, column: 42 },
                    source: '<div id=a class="c" inert style=\'\'></div>'
                }
            });
        });
        test('directive with no value', function () {
            var ast = parse_1.parse('<div v-if/>');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'if',
                arg: undefined,
                modifiers: [],
                exp: undefined,
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 9, line: 1, column: 10 },
                    source: 'v-if'
                }
            });
        });
        test('directive with value', function () {
            var ast = parse_1.parse('<div v-if="a"/>');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'if',
                arg: undefined,
                modifiers: [],
                exp: {
                    type: 4,
                    content: 'a',
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 11, line: 1, column: 12 },
                        end: { offset: 12, line: 1, column: 13 },
                        source: 'a'
                    }
                },
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 13, line: 1, column: 14 },
                    source: 'v-if="a"'
                }
            });
        });
        test('directive with argument', function () {
            var ast = parse_1.parse('<div v-on:click/>');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'on',
                arg: {
                    type: 4,
                    content: 'click',
                    isStatic: true,
                    isConstant: true,
                    loc: {
                        source: 'click',
                        start: {
                            column: 11,
                            line: 1,
                            offset: 10
                        },
                        end: {
                            column: 16,
                            line: 1,
                            offset: 15
                        }
                    }
                },
                modifiers: [],
                exp: undefined,
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 15, line: 1, column: 16 },
                    source: 'v-on:click'
                }
            });
        });
        test('directive with a modifier', function () {
            var ast = parse_1.parse('<div v-on.enter/>');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'on',
                arg: undefined,
                modifiers: ['enter'],
                exp: undefined,
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 15, line: 1, column: 16 },
                    source: 'v-on.enter'
                }
            });
        });
        test('directive with two modifiers', function () {
            var ast = parse_1.parse('<div v-on.enter.exact/>');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'on',
                arg: undefined,
                modifiers: ['enter', 'exact'],
                exp: undefined,
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 21, line: 1, column: 22 },
                    source: 'v-on.enter.exact'
                }
            });
        });
        test('directive with argument and modifiers', function () {
            var ast = parse_1.parse('<div v-on:click.enter.exact/>');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'on',
                arg: {
                    type: 4,
                    content: 'click',
                    isStatic: true,
                    isConstant: true,
                    loc: {
                        source: 'click',
                        start: {
                            column: 11,
                            line: 1,
                            offset: 10
                        },
                        end: {
                            column: 16,
                            line: 1,
                            offset: 15
                        }
                    }
                },
                modifiers: ['enter', 'exact'],
                exp: undefined,
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 27, line: 1, column: 28 },
                    source: 'v-on:click.enter.exact'
                }
            });
        });
        test('v-bind shorthand', function () {
            var ast = parse_1.parse('<div :a=b />');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'bind',
                arg: {
                    type: 4,
                    content: 'a',
                    isStatic: true,
                    isConstant: true,
                    loc: {
                        source: 'a',
                        start: {
                            column: 7,
                            line: 1,
                            offset: 6
                        },
                        end: {
                            column: 8,
                            line: 1,
                            offset: 7
                        }
                    }
                },
                modifiers: [],
                exp: {
                    type: 4,
                    content: 'b',
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 8, line: 1, column: 9 },
                        end: { offset: 9, line: 1, column: 10 },
                        source: 'b'
                    }
                },
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 9, line: 1, column: 10 },
                    source: ':a=b'
                }
            });
        });
        test('v-bind shorthand with modifier', function () {
            var ast = parse_1.parse('<div :a.sync=b />');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'bind',
                arg: {
                    type: 4,
                    content: 'a',
                    isStatic: true,
                    isConstant: true,
                    loc: {
                        source: 'a',
                        start: {
                            column: 7,
                            line: 1,
                            offset: 6
                        },
                        end: {
                            column: 8,
                            line: 1,
                            offset: 7
                        }
                    }
                },
                modifiers: ['sync'],
                exp: {
                    type: 4,
                    content: 'b',
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 13, line: 1, column: 14 },
                        end: { offset: 14, line: 1, column: 15 },
                        source: 'b'
                    }
                },
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 14, line: 1, column: 15 },
                    source: ':a.sync=b'
                }
            });
        });
        test('v-on shorthand', function () {
            var ast = parse_1.parse('<div @a=b />');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'on',
                arg: {
                    type: 4,
                    content: 'a',
                    isStatic: true,
                    isConstant: true,
                    loc: {
                        source: 'a',
                        start: {
                            column: 7,
                            line: 1,
                            offset: 6
                        },
                        end: {
                            column: 8,
                            line: 1,
                            offset: 7
                        }
                    }
                },
                modifiers: [],
                exp: {
                    type: 4,
                    content: 'b',
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 8, line: 1, column: 9 },
                        end: { offset: 9, line: 1, column: 10 },
                        source: 'b'
                    }
                },
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 9, line: 1, column: 10 },
                    source: '@a=b'
                }
            });
        });
        test('v-on shorthand with modifier', function () {
            var ast = parse_1.parse('<div @a.enter=b />');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'on',
                arg: {
                    type: 4,
                    content: 'a',
                    isStatic: true,
                    isConstant: true,
                    loc: {
                        source: 'a',
                        start: {
                            column: 7,
                            line: 1,
                            offset: 6
                        },
                        end: {
                            column: 8,
                            line: 1,
                            offset: 7
                        }
                    }
                },
                modifiers: ['enter'],
                exp: {
                    type: 4,
                    content: 'b',
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 14, line: 1, column: 15 },
                        end: { offset: 15, line: 1, column: 16 },
                        source: 'b'
                    }
                },
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 15, line: 1, column: 16 },
                    source: '@a.enter=b'
                }
            });
        });
        test('v-slot shorthand', function () {
            var ast = parse_1.parse('<Comp #a="{ b }" />');
            var directive = ast.children[0].props[0];
            expect(directive).toStrictEqual({
                type: 7,
                name: 'slot',
                arg: {
                    type: 4,
                    content: 'a',
                    isStatic: true,
                    isConstant: true,
                    loc: {
                        source: 'a',
                        start: {
                            column: 8,
                            line: 1,
                            offset: 7
                        },
                        end: {
                            column: 9,
                            line: 1,
                            offset: 8
                        }
                    }
                },
                modifiers: [],
                exp: {
                    type: 4,
                    content: '{ b }',
                    isStatic: false,
                    isConstant: false,
                    loc: {
                        start: { offset: 10, line: 1, column: 11 },
                        end: { offset: 15, line: 1, column: 16 },
                        source: '{ b }'
                    }
                },
                loc: {
                    start: { offset: 6, line: 1, column: 7 },
                    end: { offset: 16, line: 1, column: 17 },
                    source: '#a="{ b }"'
                }
            });
        });
        test('v-pre', function () {
            var ast = parse_1.parse("<div v-pre :id=\"foo\"><Comp/>{{ bar }}</div>\n" +
                "<div :id=\"foo\"><Comp/>{{ bar }}</div>");
            var divWithPre = ast.children[0];
            expect(divWithPre.props).toMatchObject([
                {
                    type: 6,
                    name: ":id",
                    value: {
                        type: 2,
                        content: "foo"
                    },
                    loc: {
                        source: ":id=\"foo\"",
                        start: {
                            line: 1,
                            column: 12
                        },
                        end: {
                            line: 1,
                            column: 21
                        }
                    }
                }
            ]);
            expect(divWithPre.children[0]).toMatchObject({
                type: 1,
                tagType: 0,
                tag: "Comp"
            });
            expect(divWithPre.children[1]).toMatchObject({
                type: 2,
                content: "{{ bar }}"
            });
            var divWithoutPre = ast.children[1];
            expect(divWithoutPre.props).toMatchObject([
                {
                    type: 7,
                    name: "bind",
                    arg: {
                        type: 4,
                        isStatic: true,
                        content: "id"
                    },
                    exp: {
                        type: 4,
                        isStatic: false,
                        content: "foo"
                    },
                    loc: {
                        source: ":id=\"foo\"",
                        start: {
                            line: 2,
                            column: 6
                        },
                        end: {
                            line: 2,
                            column: 15
                        }
                    }
                }
            ]);
            expect(divWithoutPre.children[0]).toMatchObject({
                type: 1,
                tagType: 1,
                tag: "Comp"
            });
            expect(divWithoutPre.children[1]).toMatchObject({
                type: 5,
                content: {
                    type: 4,
                    content: "bar",
                    isStatic: false
                }
            });
        });
        test('end tags are case-insensitive.', function () {
            var ast = parse_1.parse('<div>hello</DIV>after');
            var element = ast.children[0];
            var text = element.children[0];
            expect(text).toStrictEqual({
                type: 2,
                content: 'hello',
                loc: {
                    start: { offset: 5, line: 1, column: 6 },
                    end: { offset: 10, line: 1, column: 11 },
                    source: 'hello'
                }
            });
        });
    });
    test('self closing single tag', function () {
        var ast = parse_1.parse('<div :class="{ some: condition }" />');
        expect(ast.children).toHaveLength(1);
        expect(ast.children[0]).toMatchObject({ tag: 'div' });
    });
    test('self closing multiple tag', function () {
        var ast = parse_1.parse("<div :class=\"{ some: condition }\" />\n" +
            "<p v-bind:style=\"{ color: 'red' }\"/>");
        expect(ast).toMatchSnapshot();
        expect(ast.children).toHaveLength(2);
        expect(ast.children[0]).toMatchObject({ tag: 'div' });
        expect(ast.children[1]).toMatchObject({ tag: 'p' });
    });
    test('valid html', function () {
        var ast = parse_1.parse("<div :class=\"{ some: condition }\">\n" +
            "  <p v-bind:style=\"{ color: 'red' }\"/>\n" +
            "  <!-- a comment with <html> inside it -->\n" +
            "</div>");
        expect(ast).toMatchSnapshot();
        expect(ast.children).toHaveLength(1);
        var el = ast.children[0];
        expect(el).toMatchObject({
            tag: 'div'
        });
        expect(el.children).toHaveLength(2);
        expect(el.children[0]).toMatchObject({
            tag: 'p'
        });
        expect(el.children[1]).toMatchObject({
            type: 3
        });
    });
    test('invalid html', function () {
        expect(function () {
            parse_1.parse("<div>\n<span>\n</div>\n</span>");
        }).toThrow('End tag was not found. (3:1)');
        var spy = jest.fn();
        var ast = parse_1.parse("<div>\n<span>\n</div>\n</span>", {
            onError: spy
        });
        expect(spy.mock.calls).toMatchObject([
            [
                {
                    code: 32,
                    loc: {
                        start: {
                            offset: 13,
                            line: 3,
                            column: 1
                        }
                    }
                }
            ],
            [
                {
                    code: 31,
                    loc: {
                        start: {
                            offset: 20,
                            line: 4,
                            column: 1
                        }
                    }
                }
            ]
        ]);
        expect(ast).toMatchSnapshot();
    });
    test('parse with correct location info', function () {
        var _a = parse_1.parse("\nfoo\n is {{ bar }} but {{ baz }}".trim()).children, foo = _a[0], bar = _a[1], but = _a[2], baz = _a[3];
        var offset = 0;
        expect(foo.loc.start).toEqual({ line: 1, column: 1, offset: offset });
        offset += foo.loc.source.length;
        expect(foo.loc.end).toEqual({ line: 2, column: 5, offset: offset });
        expect(bar.loc.start).toEqual({ line: 2, column: 5, offset: offset });
        var barInner = bar.content;
        offset += 3;
        expect(barInner.loc.start).toEqual({ line: 2, column: 8, offset: offset });
        offset += barInner.loc.source.length;
        expect(barInner.loc.end).toEqual({ line: 2, column: 11, offset: offset });
        offset += 3;
        expect(bar.loc.end).toEqual({ line: 2, column: 14, offset: offset });
        expect(but.loc.start).toEqual({ line: 2, column: 14, offset: offset });
        offset += but.loc.source.length;
        expect(but.loc.end).toEqual({ line: 2, column: 19, offset: offset });
        expect(baz.loc.start).toEqual({ line: 2, column: 19, offset: offset });
        var bazInner = baz.content;
        offset += 3;
        expect(bazInner.loc.start).toEqual({ line: 2, column: 22, offset: offset });
        offset += bazInner.loc.source.length;
        expect(bazInner.loc.end).toEqual({ line: 2, column: 25, offset: offset });
        offset += 3;
        expect(baz.loc.end).toEqual({ line: 2, column: 28, offset: offset });
    });
    describe('namedCharacterReferences option', function () {
        test('use the given map', function () {
            var ast = parse_1.parse('&amp;&cups;', {
                namedCharacterReferences: {
                    'cups;': '\u222A\uFE00'
                },
                onError: function () { }
            });
            expect(ast.children.length).toBe(1);
            expect(ast.children[0].type).toBe(2);
            expect(ast.children[0].content).toBe('&amp;\u222A\uFE00');
        });
    });
    describe('whitespace management', function () {
        it('should remove whitespaces at start/end inside an element', function () {
            var ast = parse_1.parse("<div>   <span/>    </div>");
            expect(ast.children[0].children.length).toBe(1);
        });
        it('should remove whitespaces w/ newline between elements', function () {
            var ast = parse_1.parse("<div/> \n <div/> \n <div/>");
            expect(ast.children.length).toBe(3);
            expect(ast.children.every(function (c) { return c.type === 1; })).toBe(true);
        });
        it('should remove whitespaces adjacent to comments', function () {
            var ast = parse_1.parse("<div/> \n <!--foo--> <div/>");
            expect(ast.children.length).toBe(3);
            expect(ast.children[0].type).toBe(1);
            expect(ast.children[1].type).toBe(3);
            expect(ast.children[2].type).toBe(1);
        });
        it('should remove whitespaces w/ newline between comments and elements', function () {
            var ast = parse_1.parse("<div/> \n <!--foo--> \n <div/>");
            expect(ast.children.length).toBe(3);
            expect(ast.children[0].type).toBe(1);
            expect(ast.children[1].type).toBe(3);
            expect(ast.children[2].type).toBe(1);
        });
        it('should NOT remove whitespaces w/ newline between interpolations', function () {
            var ast = parse_1.parse("{{ foo }} \n {{ bar }}");
            expect(ast.children.length).toBe(3);
            expect(ast.children[0].type).toBe(5);
            expect(ast.children[1]).toMatchObject({
                type: 2,
                content: ' '
            });
            expect(ast.children[2].type).toBe(5);
        });
        it('should NOT remove whitespaces w/o newline between elements', function () {
            var ast = parse_1.parse("<div/> <div/> <div/>");
            expect(ast.children.length).toBe(5);
            expect(ast.children.map(function (c) { return c.type; })).toMatchObject([
                1,
                2,
                1,
                2,
                1
            ]);
        });
        it('should condense consecutive whitespaces in text', function () {
            var ast = parse_1.parse("   foo  \n    bar     baz     ");
            expect(ast.children[0].content).toBe(" foo bar baz ");
        });
    });
    describe('Errors', function () {
        var patterns = {
            ABRUPT_CLOSING_OF_EMPTY_COMMENT: [
                {
                    code: '<template><!--></template>',
                    errors: [
                        {
                            type: 0,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template><!---></template>',
                    errors: [
                        {
                            type: 0,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template><!----></template>',
                    errors: []
                }
            ],
            ABSENCE_OF_DIGITS_IN_NUMERIC_CHARACTER_REFERENCE: [
                {
                    code: '<template>&#a;</template>',
                    errors: [
                        {
                            type: 1,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template>&#xg;</template>',
                    errors: [
                        {
                            type: 1,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template>&#99;</template>',
                    errors: []
                },
                {
                    code: '<template>&#xff;</template>',
                    errors: []
                },
                {
                    code: '<template attr="&#a;"></template>',
                    errors: [
                        {
                            type: 1,
                            loc: { offset: 16, line: 1, column: 17 }
                        }
                    ]
                },
                {
                    code: '<template attr="&#xg;"></template>',
                    errors: [
                        {
                            type: 1,
                            loc: { offset: 16, line: 1, column: 17 }
                        }
                    ]
                },
                {
                    code: '<template attr="&#99;"></template>',
                    errors: []
                },
                {
                    code: '<template attr="&#xff;"></template>',
                    errors: []
                }
            ],
            CDATA_IN_HTML_CONTENT: [
                {
                    code: '<template><![CDATA[cdata]]></template>',
                    errors: [
                        {
                            type: 2,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template><svg><![CDATA[cdata]]></svg></template>',
                    errors: []
                }
            ],
            CHARACTER_REFERENCE_OUTSIDE_UNICODE_RANGE: [
                {
                    code: '<template>&#1234567;</template>',
                    errors: [
                        {
                            type: 3,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                }
            ],
            CONTROL_CHARACTER_REFERENCE: [
                {
                    code: '<template>&#0003;</template>',
                    errors: [
                        {
                            type: 4,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template>&#x7F;</template>',
                    errors: [
                        {
                            type: 4,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                }
            ],
            DUPLICATE_ATTRIBUTE: [
                {
                    code: '<template><div id="" id=""></div></template>',
                    errors: [
                        {
                            type: 5,
                            loc: { offset: 21, line: 1, column: 22 }
                        }
                    ]
                }
            ],
            END_TAG_WITH_ATTRIBUTES: [
                {
                    code: '<template><div></div id=""></template>',
                    errors: [
                        {
                            type: 6,
                            loc: { offset: 21, line: 1, column: 22 }
                        }
                    ]
                }
            ],
            END_TAG_WITH_TRAILING_SOLIDUS: [
                {
                    code: '<template><div></div/></template>',
                    errors: [
                        {
                            type: 7,
                            loc: { offset: 20, line: 1, column: 21 }
                        }
                    ]
                }
            ],
            EOF_BEFORE_TAG_NAME: [
                {
                    code: '<template><',
                    errors: [
                        {
                            type: 8,
                            loc: { offset: 11, line: 1, column: 12 }
                        },
                        {
                            type: 32,
                            loc: { offset: 11, line: 1, column: 12 }
                        }
                    ]
                },
                {
                    code: '<template></',
                    errors: [
                        {
                            type: 8,
                            loc: { offset: 12, line: 1, column: 13 }
                        },
                        {
                            type: 32,
                            loc: { offset: 12, line: 1, column: 13 }
                        }
                    ]
                }
            ],
            EOF_IN_CDATA: [
                {
                    code: '<template><svg><![CDATA[cdata',
                    errors: [
                        {
                            type: 9,
                            loc: { offset: 29, line: 1, column: 30 }
                        },
                        {
                            type: 32,
                            loc: { offset: 29, line: 1, column: 30 }
                        },
                        {
                            type: 32,
                            loc: { offset: 29, line: 1, column: 30 }
                        }
                    ]
                },
                {
                    code: '<template><svg><![CDATA[',
                    errors: [
                        {
                            type: 9,
                            loc: { offset: 24, line: 1, column: 25 }
                        },
                        {
                            type: 32,
                            loc: { offset: 24, line: 1, column: 25 }
                        },
                        {
                            type: 32,
                            loc: { offset: 24, line: 1, column: 25 }
                        }
                    ]
                }
            ],
            EOF_IN_COMMENT: [
                {
                    code: '<template><!--comment',
                    errors: [
                        {
                            type: 10,
                            loc: { offset: 21, line: 1, column: 22 }
                        },
                        {
                            type: 32,
                            loc: { offset: 21, line: 1, column: 22 }
                        }
                    ]
                },
                {
                    code: '<template><!--',
                    errors: [
                        {
                            type: 10,
                            loc: { offset: 14, line: 1, column: 15 }
                        },
                        {
                            type: 32,
                            loc: { offset: 14, line: 1, column: 15 }
                        }
                    ]
                },
                {
                    code: '<template><!',
                    errors: [
                        {
                            type: 14,
                            loc: { offset: 10, line: 1, column: 11 }
                        },
                        {
                            type: 32,
                            loc: { offset: 12, line: 1, column: 13 }
                        }
                    ]
                },
                {
                    code: '<template><!-',
                    errors: [
                        {
                            type: 14,
                            loc: { offset: 10, line: 1, column: 11 }
                        },
                        {
                            type: 32,
                            loc: { offset: 13, line: 1, column: 14 }
                        }
                    ]
                },
                {
                    code: '<template><!abc',
                    errors: [
                        {
                            type: 14,
                            loc: { offset: 10, line: 1, column: 11 }
                        },
                        {
                            type: 32,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                }
            ],
            EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT: [
                {
                    code: "<script><!--console.log('hello')",
                    errors: [
                        {
                            type: 32,
                            loc: { offset: 32, line: 1, column: 33 }
                        },
                        {
                            type: 11,
                            loc: { offset: 32, line: 1, column: 33 }
                        }
                    ]
                },
                {
                    code: "<script>console.log('hello')",
                    errors: [
                        {
                            type: 32,
                            loc: { offset: 28, line: 1, column: 29 }
                        }
                    ]
                }
            ],
            EOF_IN_TAG: [
                {
                    code: '<template><div',
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 14, line: 1, column: 15 }
                        },
                        {
                            type: 32,
                            loc: { offset: 14, line: 1, column: 15 }
                        },
                        {
                            type: 32,
                            loc: { offset: 14, line: 1, column: 15 }
                        }
                    ]
                },
                {
                    code: '<template><div ',
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 15, line: 1, column: 16 }
                        },
                        {
                            type: 32,
                            loc: { offset: 15, line: 1, column: 16 }
                        },
                        {
                            type: 32,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                },
                {
                    code: '<template><div id',
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 17, line: 1, column: 18 }
                        },
                        {
                            type: 32,
                            loc: { offset: 17, line: 1, column: 18 }
                        },
                        {
                            type: 32,
                            loc: { offset: 17, line: 1, column: 18 }
                        }
                    ]
                },
                {
                    code: '<template><div id ',
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 18, line: 1, column: 19 }
                        },
                        {
                            type: 32,
                            loc: { offset: 18, line: 1, column: 19 }
                        },
                        {
                            type: 32,
                            loc: { offset: 18, line: 1, column: 19 }
                        }
                    ]
                },
                {
                    code: '<template><div id =',
                    errors: [
                        {
                            type: 16,
                            loc: { offset: 19, line: 1, column: 20 }
                        },
                        {
                            type: 12,
                            loc: { offset: 19, line: 1, column: 20 }
                        },
                        {
                            type: 32,
                            loc: { offset: 19, line: 1, column: 20 }
                        },
                        {
                            type: 32,
                            loc: { offset: 19, line: 1, column: 20 }
                        }
                    ]
                },
                {
                    code: "<template><div id='abc",
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 22, line: 1, column: 23 }
                        },
                        {
                            type: 32,
                            loc: { offset: 22, line: 1, column: 23 }
                        },
                        {
                            type: 32,
                            loc: { offset: 22, line: 1, column: 23 }
                        }
                    ]
                },
                {
                    code: '<template><div id="abc',
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 22, line: 1, column: 23 }
                        },
                        {
                            type: 32,
                            loc: { offset: 22, line: 1, column: 23 }
                        },
                        {
                            type: 32,
                            loc: { offset: 22, line: 1, column: 23 }
                        }
                    ]
                },
                {
                    code: "<template><div id='abc'",
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 32,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 32,
                            loc: { offset: 23, line: 1, column: 24 }
                        }
                    ]
                },
                {
                    code: '<template><div id="abc"',
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 32,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 32,
                            loc: { offset: 23, line: 1, column: 24 }
                        }
                    ]
                },
                {
                    code: '<template><div id=abc',
                    errors: [
                        {
                            type: 12,
                            loc: { offset: 21, line: 1, column: 22 }
                        },
                        {
                            type: 32,
                            loc: { offset: 21, line: 1, column: 22 }
                        },
                        {
                            type: 32,
                            loc: { offset: 21, line: 1, column: 22 }
                        }
                    ]
                },
                {
                    code: "<template><div id='abc'/",
                    errors: [
                        {
                            type: 29,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 12,
                            loc: { offset: 24, line: 1, column: 25 }
                        },
                        {
                            type: 32,
                            loc: { offset: 24, line: 1, column: 25 }
                        },
                        {
                            type: 32,
                            loc: { offset: 24, line: 1, column: 25 }
                        }
                    ]
                },
                {
                    code: '<template><div id="abc"/',
                    errors: [
                        {
                            type: 29,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 12,
                            loc: { offset: 24, line: 1, column: 25 }
                        },
                        {
                            type: 32,
                            loc: { offset: 24, line: 1, column: 25 }
                        },
                        {
                            type: 32,
                            loc: { offset: 24, line: 1, column: 25 }
                        }
                    ]
                },
                {
                    code: '<template><div id=abc /',
                    errors: [
                        {
                            type: 29,
                            loc: { offset: 22, line: 1, column: 23 }
                        },
                        {
                            type: 12,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 32,
                            loc: { offset: 23, line: 1, column: 24 }
                        },
                        {
                            type: 32,
                            loc: { offset: 23, line: 1, column: 24 }
                        }
                    ]
                }
            ],
            INCORRECTLY_CLOSED_COMMENT: [
                {
                    code: '<template><!--comment--!></template>',
                    errors: [
                        {
                            type: 13,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                }
            ],
            INCORRECTLY_OPENED_COMMENT: [
                {
                    code: '<template><!></template>',
                    errors: [
                        {
                            type: 14,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template><!-></template>',
                    errors: [
                        {
                            type: 14,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template><!ELEMENT br EMPTY></template>',
                    errors: [
                        {
                            type: 14,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<!DOCTYPE html>',
                    errors: []
                }
            ],
            INVALID_FIRST_CHARACTER_OF_TAG_NAME: [
                {
                    code: '<template>a < b</template>',
                    errors: [
                        {
                            type: 15,
                            loc: { offset: 13, line: 1, column: 14 }
                        }
                    ]
                },
                {
                    code: '<template><�></template>',
                    errors: [
                        {
                            type: 15,
                            loc: { offset: 11, line: 1, column: 12 }
                        }
                    ]
                },
                {
                    code: '<template>a </ b</template>',
                    errors: [
                        {
                            type: 15,
                            loc: { offset: 14, line: 1, column: 15 }
                        },
                        {
                            type: 32,
                            loc: { offset: 27, line: 1, column: 28 }
                        }
                    ]
                },
                {
                    code: '<template></�></template>',
                    errors: [
                        {
                            type: 15,
                            loc: { offset: 12, line: 1, column: 13 }
                        }
                    ]
                },
                {
                    code: '<template>{{a < b}}</template>',
                    errors: []
                }
            ],
            MISSING_ATTRIBUTE_VALUE: [
                {
                    code: '<template><div id=></div></template>',
                    errors: [
                        {
                            type: 16,
                            loc: { offset: 18, line: 1, column: 19 }
                        }
                    ]
                },
                {
                    code: '<template><div id= ></div></template>',
                    errors: [
                        {
                            type: 16,
                            loc: { offset: 19, line: 1, column: 20 }
                        }
                    ]
                },
                {
                    code: '<template><div id= /></div></template>',
                    errors: []
                }
            ],
            MISSING_END_TAG_NAME: [
                {
                    code: '<template></></template>',
                    errors: [
                        {
                            type: 17,
                            loc: { offset: 12, line: 1, column: 13 }
                        }
                    ]
                }
            ],
            MISSING_SEMICOLON_AFTER_CHARACTER_REFERENCE: [
                {
                    code: '<template>&amp</template>',
                    options: { namedCharacterReferences: { amp: '&' } },
                    errors: [
                        {
                            type: 18,
                            loc: { offset: 14, line: 1, column: 15 }
                        }
                    ]
                },
                {
                    code: '<template>&#40</template>',
                    errors: [
                        {
                            type: 18,
                            loc: { offset: 14, line: 1, column: 15 }
                        }
                    ]
                },
                {
                    code: '<template>&#x40</template>',
                    errors: [
                        {
                            type: 18,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                }
            ],
            MISSING_WHITESPACE_BETWEEN_ATTRIBUTES: [
                {
                    code: '<template><div id="foo"class="bar"></div></template>',
                    errors: [
                        {
                            type: 19,
                            loc: { offset: 23, line: 1, column: 24 }
                        }
                    ]
                },
                {
                    code: '<template><div id="foo"\r\nclass="bar"></div></template>',
                    errors: []
                }
            ],
            NESTED_COMMENT: [
                {
                    code: '<template><!--a<!--b--></template>',
                    errors: [
                        {
                            type: 20,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                },
                {
                    code: '<template><!--a<!--b<!--c--></template>',
                    errors: [
                        {
                            type: 20,
                            loc: { offset: 15, line: 1, column: 16 }
                        },
                        {
                            type: 20,
                            loc: { offset: 20, line: 1, column: 21 }
                        }
                    ]
                },
                {
                    code: '<template><!--a<!--></template>',
                    errors: []
                },
                {
                    code: '<template><!--a<!--',
                    errors: [
                        {
                            type: 10,
                            loc: { offset: 19, line: 1, column: 20 }
                        },
                        {
                            type: 32,
                            loc: { offset: 19, line: 1, column: 20 }
                        }
                    ]
                }
            ],
            NONCHARACTER_CHARACTER_REFERENCE: [
                {
                    code: '<template>&#xFFFE;</template>',
                    errors: [
                        {
                            type: 21,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template>&#x1FFFF;</template>',
                    errors: [
                        {
                            type: 21,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                }
            ],
            NULL_CHARACTER_REFERENCE: [
                {
                    code: '<template>&#0000;</template>',
                    errors: [
                        {
                            type: 22,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                }
            ],
            SURROGATE_CHARACTER_REFERENCE: [
                {
                    code: '<template>&#xD800;</template>',
                    errors: [
                        {
                            type: 23,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                }
            ],
            UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME: [
                {
                    code: "<template><div a\"bc=''></div></template>",
                    errors: [
                        {
                            type: 24,
                            loc: { offset: 16, line: 1, column: 17 }
                        }
                    ]
                },
                {
                    code: "<template><div a'bc=''></div></template>",
                    errors: [
                        {
                            type: 24,
                            loc: { offset: 16, line: 1, column: 17 }
                        }
                    ]
                },
                {
                    code: "<template><div a<bc=''></div></template>",
                    errors: [
                        {
                            type: 24,
                            loc: { offset: 16, line: 1, column: 17 }
                        }
                    ]
                }
            ],
            UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE: [
                {
                    code: '<template><div foo=bar"></div></template>',
                    errors: [
                        {
                            type: 25,
                            loc: { offset: 22, line: 1, column: 23 }
                        }
                    ]
                },
                {
                    code: "<template><div foo=bar'></div></template>",
                    errors: [
                        {
                            type: 25,
                            loc: { offset: 22, line: 1, column: 23 }
                        }
                    ]
                },
                {
                    code: '<template><div foo=bar<div></div></template>',
                    errors: [
                        {
                            type: 25,
                            loc: { offset: 22, line: 1, column: 23 }
                        }
                    ]
                },
                {
                    code: '<template><div foo=bar=baz></div></template>',
                    errors: [
                        {
                            type: 25,
                            loc: { offset: 22, line: 1, column: 23 }
                        }
                    ]
                },
                {
                    code: '<template><div foo=bar`></div></template>',
                    errors: [
                        {
                            type: 25,
                            loc: { offset: 22, line: 1, column: 23 }
                        }
                    ]
                }
            ],
            UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME: [
                {
                    code: '<template><div =foo=bar></div></template>',
                    errors: [
                        {
                            type: 26,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                },
                {
                    code: '<template><div =></div></template>',
                    errors: [
                        {
                            type: 26,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                }
            ],
            UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME: [
                {
                    code: '<template><?xml?></template>',
                    errors: [
                        {
                            type: 28,
                            loc: { offset: 11, line: 1, column: 12 }
                        }
                    ]
                }
            ],
            UNEXPECTED_SOLIDUS_IN_TAG: [
                {
                    code: '<template><div a/b></div></template>',
                    errors: [
                        {
                            type: 29,
                            loc: { offset: 16, line: 1, column: 17 }
                        }
                    ]
                }
            ],
            UNKNOWN_NAMED_CHARACTER_REFERENCE: [
                {
                    code: '<template>&unknown;</template>',
                    errors: [
                        {
                            type: 30,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                }
            ],
            X_INVALID_END_TAG: [
                {
                    code: '<template></div></template>',
                    errors: [
                        {
                            type: 31,
                            loc: { offset: 10, line: 1, column: 11 }
                        }
                    ]
                },
                {
                    code: '<template></div></div></template>',
                    errors: [
                        {
                            type: 31,
                            loc: { offset: 10, line: 1, column: 11 }
                        },
                        {
                            type: 31,
                            loc: { offset: 16, line: 1, column: 17 }
                        }
                    ]
                },
                {
                    code: "<template>{{'</div>'}}</template>",
                    errors: []
                },
                {
                    code: '<textarea></div></textarea>',
                    errors: []
                },
                {
                    code: '<svg><![CDATA[</div>]]></svg>',
                    errors: []
                },
                {
                    code: '<svg><!--</div>--></svg>',
                    errors: []
                }
            ],
            X_MISSING_END_TAG: [
                {
                    code: '<template><div></template>',
                    errors: [
                        {
                            type: 32,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                },
                {
                    code: '<template><div>',
                    errors: [
                        {
                            type: 32,
                            loc: { offset: 15, line: 1, column: 16 }
                        },
                        {
                            type: 32,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                }
            ],
            X_MISSING_INTERPOLATION_END: [
                {
                    code: '{{ foo',
                    errors: [
                        {
                            type: 33,
                            loc: { offset: 0, line: 1, column: 1 }
                        }
                    ]
                },
                {
                    code: '{{',
                    errors: [
                        {
                            type: 33,
                            loc: { offset: 0, line: 1, column: 1 }
                        }
                    ]
                },
                {
                    code: '{{}}',
                    errors: []
                }
            ],
            X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END: [
                {
                    code: "<div v-foo:[sef fsef] />",
                    errors: [
                        {
                            type: 34,
                            loc: { offset: 15, line: 1, column: 16 }
                        }
                    ]
                }
            ]
        };
        var _loop_1 = function (key) {
            describe(key, function () {
                var _loop_2 = function (code, errors, options) {
                    test(code.replace(/[\r\n]/g, function (c) { return "\\x0" + c.codePointAt(0).toString(16) + ";"; }), function () {
                        var spy = jest.fn();
                        var ast = parse_1.parse(code, __assign(__assign({ getNamespace: function (tag, parent) {
                                var ns = parent ? parent.ns : 0;
                                if (ns === 0) {
                                    if (tag === 'svg') {
                                        return (0 + 1);
                                    }
                                }
                                return ns;
                            }, getTextMode: function (tag) {
                                if (tag === 'textarea') {
                                    return 1;
                                }
                                if (tag === 'script') {
                                    return 2;
                                }
                                return 0;
                            } }, options), { onError: spy }));
                        expect(spy.mock.calls.map(function (_a) {
                            var err = _a[0];
                            return ({
                                type: err.code,
                                loc: err.loc.start
                            });
                        })).toMatchObject(errors);
                        expect(ast).toMatchSnapshot();
                    });
                };
                for (var _i = 0, _a = patterns[key]; _i < _a.length; _i++) {
                    var _b = _a[_i], code = _b.code, errors = _b.errors, options = _b.options;
                    _loop_2(code, errors, options);
                }
            });
        };
        for (var _i = 0, _a = Object.keys(patterns); _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_1(key);
        }
    });
});
