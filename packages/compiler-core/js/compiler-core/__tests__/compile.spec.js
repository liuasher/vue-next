"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../src");
var source_map_1 = require("source-map");
describe('compiler: integration tests', function () {
    var source = "\n<div id=\"foo\" :class=\"bar.baz\">\n  {{ world.burn() }}\n  <div v-if=\"ok\">yes</div>\n  <template v-else>no</template>\n  <div v-for=\"(value, index) in list\"><span>{{ value + index }}</span></div>\n</div>\n".trim();
    function getPositionInCode(code, token, expectName) {
        if (expectName === void 0) { expectName = false; }
        var generatedOffset = code.indexOf(token);
        var line = 1;
        var lastNewLinePos = -1;
        for (var i = 0; i < generatedOffset; i++) {
            if (code.charCodeAt(i) === 10) {
                line++;
                lastNewLinePos = i;
            }
        }
        var res = {
            line: line,
            column: lastNewLinePos === -1
                ? generatedOffset
                : generatedOffset - lastNewLinePos - 1
        };
        if (expectName) {
            res.name = typeof expectName === 'string' ? expectName : token;
        }
        return res;
    }
    test('function mode', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, code, map, consumer;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = src_1.baseCompile(source, {
                        sourceMap: true,
                        filename: "foo.vue"
                    }), code = _a.code, map = _a.map;
                    expect(code).toMatchSnapshot();
                    expect(map.sources).toEqual(["foo.vue"]);
                    expect(map.sourcesContent).toEqual([source]);
                    return [4, new source_map_1.SourceMapConsumer(map)];
                case 1:
                    consumer = _b.sent();
                    expect(consumer.originalPositionFor(getPositionInCode(code, "id"))).toMatchObject(getPositionInCode(source, "id"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "\"foo\""))).toMatchObject(getPositionInCode(source, "\"foo\""));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "class:"))).toMatchObject(getPositionInCode(source, "class="));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "bar"))).toMatchObject(getPositionInCode(source, "bar"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "baz"))).toMatchObject(getPositionInCode(source, "bar"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "world"))).toMatchObject(getPositionInCode(source, "world"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "burn()"))).toMatchObject(getPositionInCode(source, "world"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "ok"))).toMatchObject(getPositionInCode(source, "ok"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "list"))).toMatchObject(getPositionInCode(source, "list"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "value"))).toMatchObject(getPositionInCode(source, "value"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "index"))).toMatchObject(getPositionInCode(source, "index"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "value + index"))).toMatchObject(getPositionInCode(source, "value + index"));
                    return [2];
            }
        });
    }); });
    test('function mode w/ prefixIdentifiers: true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, code, map, consumer;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = src_1.baseCompile(source, {
                        sourceMap: true,
                        filename: "foo.vue",
                        prefixIdentifiers: true
                    }), code = _a.code, map = _a.map;
                    expect(code).toMatchSnapshot();
                    expect(map.sources).toEqual(["foo.vue"]);
                    expect(map.sourcesContent).toEqual([source]);
                    return [4, new source_map_1.SourceMapConsumer(map)];
                case 1:
                    consumer = _b.sent();
                    expect(consumer.originalPositionFor(getPositionInCode(code, "id"))).toMatchObject(getPositionInCode(source, "id"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "\"foo\""))).toMatchObject(getPositionInCode(source, "\"foo\""));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "class:"))).toMatchObject(getPositionInCode(source, "class="));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "bar"))).toMatchObject(getPositionInCode(source, "bar"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.bar", "bar"))).toMatchObject(getPositionInCode(source, "bar", true));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "baz"))).toMatchObject(getPositionInCode(source, "baz"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "world", true))).toMatchObject(getPositionInCode(source, "world", "world"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.world", "world"))).toMatchObject(getPositionInCode(source, "world", "world"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "burn()"))).toMatchObject(getPositionInCode(source, "burn()"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "ok"))).toMatchObject(getPositionInCode(source, "ok"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.ok", "ok"))).toMatchObject(getPositionInCode(source, "ok", true));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "list"))).toMatchObject(getPositionInCode(source, "list"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.list", "list"))).toMatchObject(getPositionInCode(source, "list", true));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "value"))).toMatchObject(getPositionInCode(source, "value"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "index"))).toMatchObject(getPositionInCode(source, "index"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "value + index"))).toMatchObject(getPositionInCode(source, "value + index"));
                    return [2];
            }
        });
    }); });
    test('module mode', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, code, map, consumer;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = src_1.baseCompile(source, {
                        mode: 'module',
                        sourceMap: true,
                        filename: "foo.vue"
                    }), code = _a.code, map = _a.map;
                    expect(code).toMatchSnapshot();
                    expect(map.sources).toEqual(["foo.vue"]);
                    expect(map.sourcesContent).toEqual([source]);
                    return [4, new source_map_1.SourceMapConsumer(map)];
                case 1:
                    consumer = _b.sent();
                    expect(consumer.originalPositionFor(getPositionInCode(code, "id"))).toMatchObject(getPositionInCode(source, "id"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "\"foo\""))).toMatchObject(getPositionInCode(source, "\"foo\""));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "class:"))).toMatchObject(getPositionInCode(source, "class="));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "bar"))).toMatchObject(getPositionInCode(source, "bar"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.bar", "bar"))).toMatchObject(getPositionInCode(source, "bar", true));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "baz"))).toMatchObject(getPositionInCode(source, "baz"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "world", true))).toMatchObject(getPositionInCode(source, "world", "world"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.world", "world"))).toMatchObject(getPositionInCode(source, "world", "world"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "burn()"))).toMatchObject(getPositionInCode(source, "burn()"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "ok"))).toMatchObject(getPositionInCode(source, "ok"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.ok", "ok"))).toMatchObject(getPositionInCode(source, "ok", true));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "list"))).toMatchObject(getPositionInCode(source, "list"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "_ctx.list", "list"))).toMatchObject(getPositionInCode(source, "list", true));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "value"))).toMatchObject(getPositionInCode(source, "value"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "index"))).toMatchObject(getPositionInCode(source, "index"));
                    expect(consumer.originalPositionFor(getPositionInCode(code, "value + index"))).toMatchObject(getPositionInCode(source, "value + index"));
                    return [2];
            }
        });
    }); });
});
