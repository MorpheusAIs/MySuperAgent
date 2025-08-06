"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK = exports.NETWORK_CONTEXT_BY_NETWORK = void 0;
const tslib_1 = require("tslib");
const depd_1 = tslib_1.__importDefault(require("depd"));
const contracts_1 = require("@lit-protocol/contracts");
const deprecated = (0, depd_1.default)('lit-js-sdk:constants:mappers');
/**
 * Mapping of network context by network value.
 */
exports.NETWORK_CONTEXT_BY_NETWORK = {
    'datil-dev': contracts_1.datilDev,
    'datil-test': contracts_1.datilTest,
    datil: contracts_1.datil,
    // just use datil dev abis for custom
    custom: contracts_1.datilDev,
};
exports.GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK = {
    'datil-dev': false,
    'datil-test': false,
    datil: false,
    custom: false,
};
//# sourceMappingURL=mappers.js.map