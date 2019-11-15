"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
function defaultOnError(error) {
    throw error;
}
exports.defaultOnError = defaultOnError;
function createCompilerError(code, loc, messages) {
    var msg = __DEV__ || !__BROWSER__ ? (messages || exports.errorMessages)[code] : code;
    var locInfo = loc ? " (" + loc.start.line + ":" + loc.start.column + ")" : "";
    var error = new SyntaxError(msg + locInfo);
    error.code = code;
    error.loc = loc;
    return error;
}
exports.createCompilerError = createCompilerError;
exports.errorMessages = (_a = {},
    _a[0] = 'Illegal comment.',
    _a[1] = 'Illegal numeric character reference: invalid character.',
    _a[2] = 'CDATA section is allowed only in XML context.',
    _a[3] = 'Illegal numeric character reference: too big.',
    _a[4] = 'Illegal numeric character reference: control character.',
    _a[5] = 'Duplicate attribute.',
    _a[6] = 'End tag cannot have attributes.',
    _a[7] = "Illegal '/' in tags.",
    _a[8] = 'Unexpected EOF in tag.',
    _a[9] = 'Unexpected EOF in CDATA section.',
    _a[10] = 'Unexpected EOF in comment.',
    _a[11] = 'Unexpected EOF in script.',
    _a[12] = 'Unexpected EOF in tag.',
    _a[13] = 'Incorrectly closed comment.',
    _a[14] = 'Incorrectly opened comment.',
    _a[15] = "Illegal tag name. Use '&lt;' to print '<'.",
    _a[16] = 'Attribute value was expected.',
    _a[17] = 'End tag name was expected.',
    _a[18] = 'Semicolon was expected.',
    _a[19] = 'Whitespace was expected.',
    _a[20] = "Unexpected '<!--' in comment.",
    _a[21] = 'Illegal numeric character reference: non character.',
    _a[22] = 'Illegal numeric character reference: null character.',
    _a[23] = 'Illegal numeric character reference: non-pair surrogate.',
    _a[24] = 'Attribute name cannot contain U+0022 ("), U+0027 (\'), and U+003C (<).',
    _a[25] = 'Unquoted attribute value cannot contain U+0022 ("), U+0027 (\'), U+003C (<), U+003D (=), and U+0060 (`).',
    _a[26] = "Attribute name cannot start with '='.",
    _a[28] = "'<?' is allowed only in XML context.",
    _a[29] = "Illegal '/' in tags.",
    _a[30] = 'Unknown entity name.',
    _a[31] = 'Invalid end tag.',
    _a[32] = 'End tag was not found.',
    _a[33] = 'Interpolation end sign was not found.',
    _a[34] = 'End bracket for dynamic directive argument was not found. ' +
        'Note that dynamic directive argument cannot contain spaces.',
    _a[35] = "v-if/v-else-if is missing expression.",
    _a[36] = "v-else/v-else-if has no adjacent v-if.",
    _a[37] = "v-for is missing expression.",
    _a[38] = "v-for has invalid expression.",
    _a[39] = "v-bind is missing expression.",
    _a[40] = "v-on is missing expression.",
    _a[41] = "Unexpected custom directive on <slot> outlet.",
    _a[42] = "Named v-slot on component. " +
        "Named slots should use <template v-slot> syntax nested inside the component.",
    _a[43] = "Mixed v-slot usage on both the component and nested <template>." +
        "The default slot should also use <template> syntax when there are other " +
        "named slots to avoid scope ambiguity.",
    _a[44] = "Duplicate slot names found. ",
    _a[45] = "Extraneous children found when component has explicit slots. " +
        "These children will be ignored.",
    _a[46] = "v-slot can only be used on components or <template> tags.",
    _a[47] = "v-model is missing expression.",
    _a[48] = "v-model value must be a valid JavaScript member expression.",
    _a[49] = "v-model cannot be used on v-for or v-slot scope variables because they are not writable.",
    _a[50] = "Invalid JavaScript expression.",
    _a[51] = "\"prefixIdentifiers\" option is not supported in this build of compiler.",
    _a[52] = "ES module mode is not supported in this build of compiler.",
    _a);
