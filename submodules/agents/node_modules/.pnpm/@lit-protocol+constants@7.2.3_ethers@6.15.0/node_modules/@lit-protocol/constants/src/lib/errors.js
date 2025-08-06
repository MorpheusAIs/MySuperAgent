"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrongParamFormat = exports.WrongNetworkException = exports.WasmInitError = exports.WalletSignatureNotFoundError = exports.UnsupportedMethodError = exports.UnsupportedChainException = exports.UnknownSignatureType = exports.UnknownSignatureError = exports.UnknownError = exports.UnknownDecryptionAlgorithmTypeError = exports.UnauthorizedException = exports.TransactionError = exports.RemovedFunctionError = exports.ParamsMissingError = exports.ParamNullError = exports.NodejsException = exports.NodeError = exports.NoWalletException = exports.NoValidShares = exports.NetworkError = exports.MintingNotSupported = exports.LocalStorageItemNotSetException = exports.LocalStorageItemNotRemovedException = exports.LocalStorageItemNotFoundException = exports.LitNodeClientNotReadyError = exports.LitNodeClientBadConfigError = exports.InvalidUnifiedConditionType = exports.InvalidSignatureError = exports.InvalidParamType = exports.InvalidNodeAttestation = exports.InvalidSessionSigs = exports.InvalidEthBlockhash = exports.InvalidBooleanException = exports.InvalidArgumentException = exports.InvalidAccessControlConditions = exports.InitError = exports.AutomationError = exports.MultiError = exports.LitError = exports.LIT_ERROR_CODE = exports.LIT_ERROR = exports.LitErrorKind = exports.LIT_ERROR_KIND = void 0;
const tslib_1 = require("tslib");
// @ts-expect-error No types available for this package
const verror_1 = require("@openagenda/verror");
const depd_1 = tslib_1.__importDefault(require("depd"));
const deprecated = (0, depd_1.default)('lit-js-sdk:constants:errors');
exports.LIT_ERROR_KIND = {
    Unknown: 'Unknown',
    Unexpected: 'Unexpected',
    Generic: 'Generic',
    Config: 'Config',
    Validation: 'Validation',
    Conversion: 'Conversion',
    Parser: 'Parser',
    Serializer: 'Serializer',
    Timeout: 'Timeout',
};
/**
 * @deprecated Will be removed - Use LIT_ERROR_KIND instead
 * Alias for LIT_ERROR_KIND. Added for backwards compatibility.
 * See {@link LIT_ERROR_KIND}
 */
exports.LitErrorKind = new Proxy(exports.LIT_ERROR_KIND, {
    get(target, prop, receiver) {
        deprecated('LitErrorKind is deprecated and will be removed in a future version. Use LIT_ERROR_KIND instead.');
        return Reflect.get(target, prop, receiver);
    },
});
exports.LIT_ERROR = {
    INVALID_PARAM_TYPE: {
        name: 'InvalidParamType',
        code: 'invalid_param_type',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    INVALID_ACCESS_CONTROL_CONDITIONS: {
        name: 'InvalidAccessControlConditions',
        code: 'invalid_access_control_conditions',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    WRONG_NETWORK_EXCEPTION: {
        name: 'WrongNetworkException',
        code: 'wrong_network_exception',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    MINTING_NOT_SUPPORTED: {
        name: 'MintingNotSupported',
        code: 'minting_not_supported',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    UNSUPPORTED_CHAIN_EXCEPTION: {
        name: 'UnsupportedChainException',
        code: 'unsupported_chain_exception',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    INVALID_UNIFIED_CONDITION_TYPE: {
        name: 'InvalidUnifiedConditionType',
        code: 'invalid_unified_condition_type',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    LIT_NODE_CLIENT_NOT_READY_ERROR: {
        name: 'LitNodeClientNotReadyError',
        code: 'lit_node_client_not_ready_error',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    UNAUTHORIZED_EXCEPTION: {
        name: 'UnauthorizedException',
        code: 'unauthorized_exception',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    INVALID_ARGUMENT_EXCEPTION: {
        name: 'InvalidArgumentException',
        code: 'invalid_argument_exception',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    INVALID_BOOLEAN_EXCEPTION: {
        name: 'InvalidBooleanException',
        code: 'invalid_boolean_exception',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    UNKNOWN_ERROR: {
        name: 'UnknownError',
        code: 'unknown_error',
        kind: exports.LIT_ERROR_KIND.Unknown,
    },
    NO_WALLET_EXCEPTION: {
        name: 'NoWalletException',
        code: 'no_wallet_exception',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    WRONG_PARAM_FORMAT: {
        name: 'WrongParamFormat',
        code: 'wrong_param_format',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    LOCAL_STORAGE_ITEM_NOT_FOUND_EXCEPTION: {
        name: 'LocalStorageItemNotFoundException',
        code: 'local_storage_item_not_found_exception',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    LOCAL_STORAGE_ITEM_NOT_SET_EXCEPTION: {
        name: 'LocalStorageItemNotSetException',
        code: 'local_storage_item_not_set_exception',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    LOCAL_STORAGE_ITEM_NOT_REMOVED_EXCEPTION: {
        name: 'LocalStorageItemNotRemovedException',
        code: 'local_storage_item_not_removed_exception',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    REMOVED_FUNCTION_ERROR: {
        name: 'RemovedFunctionError',
        code: 'removed_function_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    UNSUPPORTED_METHOD_ERROR: {
        name: 'UnsupportedMethodError',
        code: 'unsupported_method_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    LIT_NODE_CLIENT_BAD_CONFIG_ERROR: {
        name: 'LitNodeClientBadConfigError',
        code: 'lit_node_client_bad_config_error',
        kind: exports.LIT_ERROR_KIND.Config,
    },
    PARAMS_MISSING_ERROR: {
        name: 'ParamsMissingError',
        code: 'params_missing_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    UNKNOWN_SIGNATURE_TYPE: {
        name: 'UnknownSignatureType',
        code: 'unknown_signature_type',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    UNKNOWN_SIGNATURE_ERROR: {
        name: 'UnknownSignatureError',
        code: 'unknown_signature_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    INVALID_SIGNATURE_ERROR: {
        name: 'InvalidSignatureError',
        code: 'invalid_signature_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    PARAM_NULL_ERROR: {
        name: 'ParamNullError',
        code: 'param_null_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    UNKNOWN_DECRYPTION_ALGORITHM_TYPE_ERROR: {
        name: 'UnknownDecryptionAlgorithmTypeError',
        code: 'unknown_decryption_algorithm_type_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    WASM_INIT_ERROR: {
        name: 'WasmInitError',
        code: 'wasm_init_error',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    NODEJS_EXCEPTION: {
        name: 'NodejsException',
        code: 'nodejs_exception',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    NODE_ERROR: {
        name: 'NodeError',
        code: 'node_error',
        kind: exports.LitErrorKind.Unknown,
    },
    WALLET_SIGNATURE_NOT_FOUND_ERROR: {
        name: 'WalletSignatureNotFoundError',
        code: 'wallet_signature_not_found_error',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    NO_VALID_SHARES: {
        name: 'NoValidShares',
        code: 'no_valid_shares',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    INVALID_NODE_ATTESTATION: {
        name: 'InvalidNodeAttestation',
        code: 'invalid_node_attestation',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    INVALID_ETH_BLOCKHASH: {
        name: 'InvalidEthBlockhash',
        code: 'invalid_eth_blockhash',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    INVALID_SESSION_SIGS: {
        name: 'InvalidSessionSigs',
        code: 'invalid_session_sigs',
        kind: exports.LIT_ERROR_KIND.Validation,
    },
    INIT_ERROR: {
        name: 'InitError',
        code: 'init_error',
        kind: exports.LIT_ERROR_KIND.Unexpected,
    },
    NETWORK_ERROR: {
        name: 'NetworkError',
        code: 'network_error',
        kind: exports.LitErrorKind.Unexpected,
    },
    TRANSACTION_ERROR: {
        name: 'TransactionError',
        code: 'transaction_error',
        kind: exports.LitErrorKind.Unexpected,
    },
    AUTOMATION_ERROR: {
        name: 'AutomationError',
        code: 'automation_error',
        kind: exports.LitErrorKind.Unexpected,
    },
};
exports.LIT_ERROR_CODE = {
    NODE_NOT_AUTHORIZED: 'NodeNotAuthorized',
};
class LitError extends verror_1.VError {
    constructor(options, message, ...params) {
        super(options, message, ...params);
    }
}
exports.LitError = LitError;
function createErrorClass({ name, code, kind, }) {
    return class extends LitError {
        // VError has optional options parameter, but we make it required so thrower remembers to pass all the useful info
        constructor(options, message, ...params) {
            if (options instanceof Error) {
                options = {
                    cause: options,
                };
            }
            // If the cause is not an Error, wrap it in one
            if (!(options.cause instanceof Error)) {
                options.cause = new Error(options.cause);
            }
            super({
                name,
                ...options,
                meta: {
                    code,
                    kind,
                    ...options.meta,
                },
            }, message, ...params);
        }
    };
}
const errorClasses = {};
for (const key in exports.LIT_ERROR) {
    if (key in exports.LIT_ERROR) {
        const errorDef = exports.LIT_ERROR[key];
        errorClasses[errorDef.name] = createErrorClass(errorDef);
    }
}
// Re-export to allow MultiErrors but keep the centralized VError import here
const MultiError = verror_1.VError.MultiError;
exports.MultiError = MultiError;
exports.AutomationError = errorClasses.AutomationError, exports.InitError = errorClasses.InitError, exports.InvalidAccessControlConditions = errorClasses.InvalidAccessControlConditions, exports.InvalidArgumentException = errorClasses.InvalidArgumentException, exports.InvalidBooleanException = errorClasses.InvalidBooleanException, exports.InvalidEthBlockhash = errorClasses.InvalidEthBlockhash, exports.InvalidSessionSigs = errorClasses.InvalidSessionSigs, exports.InvalidNodeAttestation = errorClasses.InvalidNodeAttestation, exports.InvalidParamType = errorClasses.InvalidParamType, exports.InvalidSignatureError = errorClasses.InvalidSignatureError, exports.InvalidUnifiedConditionType = errorClasses.InvalidUnifiedConditionType, exports.LitNodeClientBadConfigError = errorClasses.LitNodeClientBadConfigError, exports.LitNodeClientNotReadyError = errorClasses.LitNodeClientNotReadyError, exports.LocalStorageItemNotFoundException = errorClasses.LocalStorageItemNotFoundException, exports.LocalStorageItemNotRemovedException = errorClasses.LocalStorageItemNotRemovedException, exports.LocalStorageItemNotSetException = errorClasses.LocalStorageItemNotSetException, exports.MintingNotSupported = errorClasses.MintingNotSupported, exports.NetworkError = errorClasses.NetworkError, exports.NoValidShares = errorClasses.NoValidShares, exports.NoWalletException = errorClasses.NoWalletException, exports.NodeError = errorClasses.NodeError, exports.NodejsException = errorClasses.NodejsException, exports.ParamNullError = errorClasses.ParamNullError, exports.ParamsMissingError = errorClasses.ParamsMissingError, exports.RemovedFunctionError = errorClasses.RemovedFunctionError, exports.TransactionError = errorClasses.TransactionError, exports.UnauthorizedException = errorClasses.UnauthorizedException, exports.UnknownDecryptionAlgorithmTypeError = errorClasses.UnknownDecryptionAlgorithmTypeError, exports.UnknownError = errorClasses.UnknownError, exports.UnknownSignatureError = errorClasses.UnknownSignatureError, exports.UnknownSignatureType = errorClasses.UnknownSignatureType, exports.UnsupportedChainException = errorClasses.UnsupportedChainException, exports.UnsupportedMethodError = errorClasses.UnsupportedMethodError, exports.WalletSignatureNotFoundError = errorClasses.WalletSignatureNotFoundError, exports.WasmInitError = errorClasses.WasmInitError, exports.WrongNetworkException = errorClasses.WrongNetworkException, exports.WrongParamFormat = errorClasses.WrongParamFormat;
//# sourceMappingURL=errors.js.map