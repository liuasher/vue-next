"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../src");
describe('compiler: codeframe', function () {
    var source = "\n    <div>\n      <template key=\"one\"></template>\n      <ul>\n        <li v-for=\"foobar\">hi</li>\n      </ul>\n      <template key=\"two\"></template>\n    </div>\n  ".trim();
    test('line near top', function () {
        var keyStart = source.indexOf("key=\"one\"");
        var keyEnd = keyStart + "key=\"one\"".length;
        expect(src_1.generateCodeFrame(source, keyStart, keyEnd)).toMatchSnapshot();
    });
    test('line in middle', function () {
        var forStart = source.indexOf("v-for=");
        var forEnd = forStart + "v-for=\"foobar\"".length;
        expect(src_1.generateCodeFrame(source, forStart, forEnd)).toMatchSnapshot();
    });
    test('line near bottom', function () {
        var keyStart = source.indexOf("key=\"two\"");
        var keyEnd = keyStart + "key=\"two\"".length;
        expect(src_1.generateCodeFrame(source, keyStart, keyEnd)).toMatchSnapshot();
    });
    test('multi-line highlights', function () {
        var source = "\n      <div attr=\"some\n        multiline\n      attr\n      \">\n      </div>\n    ".trim();
        var attrStart = source.indexOf("attr=");
        var attrEnd = source.indexOf("\">") + 1;
        expect(src_1.generateCodeFrame(source, attrStart, attrEnd)).toMatchSnapshot();
    });
});
