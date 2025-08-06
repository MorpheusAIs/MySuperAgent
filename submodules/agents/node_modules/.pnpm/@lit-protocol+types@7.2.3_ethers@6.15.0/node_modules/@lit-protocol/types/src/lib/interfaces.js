"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeClientErrorV0 = void 0;
const tslib_1 = require("tslib");
const depd_1 = tslib_1.__importDefault(require("depd"));
const deprecated = (0, depd_1.default)('lit-js-sdk:types:interfaces');
/**
 * @deprecated - This is the old error object.  It will be removed in the future. Use NodeClientErrorV1 instead.
 */
exports.NodeClientErrorV0 = new Proxy({
    errorCode: '',
    message: '',
    error: '',
    name: '',
}, {
    get(target, prop, receiver) {
        deprecated('NodeClientErrorV0 is deprecated and will be removed in a future version. Use NodeClientErrorV1 instead.');
        return Reflect.get(target, prop, receiver);
    },
});
//# sourceMappingURL=interfaces.js.map