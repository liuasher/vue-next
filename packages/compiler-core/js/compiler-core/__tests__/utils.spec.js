"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../src/utils");
function p(line, column, offset) {
    return { column: column, line: line, offset: offset };
}
describe('advancePositionWithClone', function () {
    test('same line', function () {
        var pos = p(1, 1, 0);
        var newPos = utils_1.advancePositionWithClone(pos, 'foo\nbar', 2);
        expect(newPos.column).toBe(3);
        expect(newPos.line).toBe(1);
        expect(newPos.offset).toBe(2);
    });
    test('same line', function () {
        var pos = p(1, 1, 0);
        var newPos = utils_1.advancePositionWithClone(pos, 'foo\nbar', 4);
        expect(newPos.column).toBe(1);
        expect(newPos.line).toBe(2);
        expect(newPos.offset).toBe(4);
    });
    test('multiple lines', function () {
        var pos = p(1, 1, 0);
        var newPos = utils_1.advancePositionWithClone(pos, 'foo\nbar\nbaz', 10);
        expect(newPos.column).toBe(3);
        expect(newPos.line).toBe(3);
        expect(newPos.offset).toBe(10);
    });
});
describe('getInnerRange', function () {
    var loc1 = {
        source: 'foo\nbar\nbaz',
        start: p(1, 1, 0),
        end: p(3, 3, 11)
    };
    test('at start', function () {
        var loc2 = utils_1.getInnerRange(loc1, 0, 4);
        expect(loc2.start).toEqual(loc1.start);
        expect(loc2.end.column).toBe(1);
        expect(loc2.end.line).toBe(2);
        expect(loc2.end.offset).toBe(4);
    });
    test('at end', function () {
        var loc2 = utils_1.getInnerRange(loc1, 4);
        expect(loc2.start.column).toBe(1);
        expect(loc2.start.line).toBe(2);
        expect(loc2.start.offset).toBe(4);
        expect(loc2.end).toEqual(loc1.end);
    });
    test('in between', function () {
        var loc2 = utils_1.getInnerRange(loc1, 4, 3);
        expect(loc2.start.column).toBe(1);
        expect(loc2.start.line).toBe(2);
        expect(loc2.start.offset).toBe(4);
        expect(loc2.end.column).toBe(4);
        expect(loc2.end.line).toBe(2);
        expect(loc2.end.offset).toBe(7);
    });
});
