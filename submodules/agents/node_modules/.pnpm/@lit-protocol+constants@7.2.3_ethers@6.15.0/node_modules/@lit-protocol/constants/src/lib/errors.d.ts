import { VError, Options } from '@openagenda/verror';
export declare const LIT_ERROR_KIND: {
    readonly Unknown: "Unknown";
    readonly Unexpected: "Unexpected";
    readonly Generic: "Generic";
    readonly Config: "Config";
    readonly Validation: "Validation";
    readonly Conversion: "Conversion";
    readonly Parser: "Parser";
    readonly Serializer: "Serializer";
    readonly Timeout: "Timeout";
};
/**
 * @deprecated Will be removed - Use LIT_ERROR_KIND instead
 * Alias for LIT_ERROR_KIND. Added for backwards compatibility.
 * See {@link LIT_ERROR_KIND}
 */
export declare const LitErrorKind: {
    readonly Unknown: "Unknown";
    readonly Unexpected: "Unexpected";
    readonly Generic: "Generic";
    readonly Config: "Config";
    readonly Validation: "Validation";
    readonly Conversion: "Conversion";
    readonly Parser: "Parser";
    readonly Serializer: "Serializer";
    readonly Timeout: "Timeout";
};
interface ErrorConfig {
    name: string;
    code: string;
    kind: (typeof LIT_ERROR_KIND)[keyof typeof LIT_ERROR_KIND];
}
export declare const LIT_ERROR: Record<string, ErrorConfig>;
export declare const LIT_ERROR_CODE: {
    NODE_NOT_AUTHORIZED: string;
};
export declare abstract class LitError extends VError {
    protected constructor(options: Error | Options, message: string, ...params: any[]);
}
type LitErrorConstructor = new (options: Error | Options, message: string, ...params: any[]) => LitError;
declare const MultiError: any;
export { MultiError };
export declare const AutomationError: LitErrorConstructor, InitError: LitErrorConstructor, InvalidAccessControlConditions: LitErrorConstructor, InvalidArgumentException: LitErrorConstructor, InvalidBooleanException: LitErrorConstructor, InvalidEthBlockhash: LitErrorConstructor, InvalidSessionSigs: LitErrorConstructor, InvalidNodeAttestation: LitErrorConstructor, InvalidParamType: LitErrorConstructor, InvalidSignatureError: LitErrorConstructor, InvalidUnifiedConditionType: LitErrorConstructor, LitNodeClientBadConfigError: LitErrorConstructor, LitNodeClientNotReadyError: LitErrorConstructor, LocalStorageItemNotFoundException: LitErrorConstructor, LocalStorageItemNotRemovedException: LitErrorConstructor, LocalStorageItemNotSetException: LitErrorConstructor, MintingNotSupported: LitErrorConstructor, NetworkError: LitErrorConstructor, NoValidShares: LitErrorConstructor, NoWalletException: LitErrorConstructor, NodeError: LitErrorConstructor, NodejsException: LitErrorConstructor, ParamNullError: LitErrorConstructor, ParamsMissingError: LitErrorConstructor, RemovedFunctionError: LitErrorConstructor, TransactionError: LitErrorConstructor, UnauthorizedException: LitErrorConstructor, UnknownDecryptionAlgorithmTypeError: LitErrorConstructor, UnknownError: LitErrorConstructor, UnknownSignatureError: LitErrorConstructor, UnknownSignatureType: LitErrorConstructor, UnsupportedChainException: LitErrorConstructor, UnsupportedMethodError: LitErrorConstructor, WalletSignatureNotFoundError: LitErrorConstructor, WasmInitError: LitErrorConstructor, WrongNetworkException: LitErrorConstructor, WrongParamFormat: LitErrorConstructor;
