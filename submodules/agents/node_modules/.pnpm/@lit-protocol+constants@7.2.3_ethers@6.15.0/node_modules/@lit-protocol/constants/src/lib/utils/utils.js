"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ELeft = ELeft;
exports.ERight = ERight;
const constants_1 = require("../constants/constants");
/**
 *
 * This method should be used when there's an expected error
 *
 * @param error is the error encountered
 * @returns { IEither }
 */
function ELeft(error) {
    return {
        type: constants_1.EITHER_TYPE.ERROR,
        result: error,
    };
}
/**
 *
 * This method should be used when there's an expected success outcome
 *
 * @param result is the successful return value
 * @returns
 */
function ERight(result) {
    return {
        type: constants_1.EITHER_TYPE.SUCCESS,
        result,
    };
}
//# sourceMappingURL=utils.js.map