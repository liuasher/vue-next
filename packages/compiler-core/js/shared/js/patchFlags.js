"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicPatchFlags = {
    TEXT: 1,
    CLASS: 2,
    STYLE: 4,
    PROPS: 8,
    NEED_PATCH: 32,
    FULL_PROPS: 16,
    KEYED_FRAGMENT: 64,
    UNKEYED_FRAGMENT: 128,
    DYNAMIC_SLOTS: 256,
    BAIL: -1
};
exports.PatchFlagNames = (_a = {},
    _a[1] = "TEXT",
    _a[2] = "CLASS",
    _a[4] = "STYLE",
    _a[8] = "PROPS",
    _a[32] = "NEED_PATCH",
    _a[16] = "FULL_PROPS",
    _a[64] = "KEYED_FRAGMENT",
    _a[128] = "UNKEYED_FRAGMENT",
    _a[256] = "DYNAMIC_SLOTS",
    _a[-1] = "BAIL",
    _a);
