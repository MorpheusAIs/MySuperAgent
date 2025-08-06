"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIT_ENDPOINT = exports.LIT_ENDPOINT_VERSION = void 0;
exports.LIT_ENDPOINT_VERSION = {
    V0: '/',
    V1: '/v1',
};
exports.LIT_ENDPOINT = {
    HANDSHAKE: {
        path: '/web/handshake',
        version: exports.LIT_ENDPOINT_VERSION.V0,
    },
    SIGN_SESSION_KEY: {
        path: '/web/sign_session_key',
        version: exports.LIT_ENDPOINT_VERSION.V1,
    },
    EXECUTE_JS: {
        path: '/web/execute',
        version: exports.LIT_ENDPOINT_VERSION.V1,
    },
    PKP_SIGN: {
        path: '/web/pkp/sign',
        version: exports.LIT_ENDPOINT_VERSION.V1,
    },
    PKP_CLAIM: {
        path: '/web/pkp/claim',
        version: exports.LIT_ENDPOINT_VERSION.V0,
    },
    SIGN_ACCS: {
        path: '/web/signing/access_control_condition',
        version: exports.LIT_ENDPOINT_VERSION.V0,
    },
    ENCRYPTION_SIGN: {
        path: '/web/encryption/sign',
        version: exports.LIT_ENDPOINT_VERSION.V0,
    },
};
//# sourceMappingURL=endpoints.js.map