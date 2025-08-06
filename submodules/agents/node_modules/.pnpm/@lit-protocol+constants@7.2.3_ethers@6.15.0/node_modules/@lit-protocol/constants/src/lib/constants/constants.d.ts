import { LITChain, LITCosmosChain, LITEVMChain, LITSVMChain } from '@lit-protocol/types';
/**
 * Lit Protocol Network Public Key
 */
export declare const NETWORK_PUB_KEY: string;
export declare const LIT_AUTH_SIG_CHAIN_KEYS: string[];
export declare const AUTH_SIGNATURE_BODY = "I am creating an account to use Lit Protocol at {{timestamp}}";
/**
 * EVM Chains supported by the LIT protocol.  Each chain includes an optional pre-deployed token contract that you may use for minting LITs.  These are ERC1155 contracts that let you mint any quantity of a given token.  Use the chain name as a key in this object.
 * @constant
 * @type { LITEVMChain }
 * @default
 */
export declare const LIT_CHAINS: LITChain<LITEVMChain>;
/**
 * Object containing information to submit to Metamask
 */
export declare const METAMASK_CHAIN_INFO: {
    /**
     * Information about the "chronicleYellowstone" chain.
     */
    yellowstone: {
        chainId: number;
        chainName: string;
        nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
        };
        rpcUrls: string[];
        blockExplorerUrls: string[];
        iconUrls: string[];
    };
};
/**
 * @deprecated Will be removed - Use METAMASK_CHAIN_INFO instead
 * Alias for {@link METAMASK_CHAIN_INFO}. Added for backwards compatibility.
 * See {@link METAMASK_CHAIN_INFO}
 */
export declare const metamaskChainInfo: {
    /**
     * Information about the "chronicleYellowstone" chain.
     */
    yellowstone: {
        chainId: number;
        chainName: string;
        nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
        };
        rpcUrls: string[];
        blockExplorerUrls: string[];
        iconUrls: string[];
    };
};
/**
 * Constants representing the available LIT RPC endpoints.
 */
export declare const LIT_RPC: {
    /**
     * Local Anvil RPC endpoint.
     */
    readonly LOCAL_ANVIL: "http://127.0.0.1:8545";
    /**
     * Chronicle Yellowstone RPC endpoint - used for >= Datil-test
     * More info: https://app.conduit.xyz/published/view/chronicle-yellowstone-testnet-9qgmzfcohk
     */
    readonly CHRONICLE_YELLOWSTONE: "https://yellowstone-rpc.litprotocol.com";
};
export declare const LIT_EVM_CHAINS: LITChain<LITEVMChain>;
/**
 * Represents the Lit Network constants.
 */
export declare const LIT_NETWORK: {
    readonly DatilDev: "datil-dev";
    readonly DatilTest: "datil-test";
    readonly Datil: "datil";
    readonly Custom: "custom";
};
/**
 * @deprecated Will be removed. - Use LIT_NETWORK instead
 * Alias for LIT_NETWORK. Added for backwards compatibility.
 * See {@link LIT_NETWORK}
 */
export declare const LitNetwork: {
    readonly DatilDev: "datil-dev";
    readonly DatilTest: "datil-test";
    readonly Datil: "datil";
    readonly Custom: "custom";
};
/**
 * The type representing the keys of the LIT_NETWORK object.
 */
export type LIT_NETWORK_TYPES = keyof typeof LIT_NETWORK;
/**
 * The type representing the values of the LIT_NETWORK object.
 * This should replicate LIT_NETWORKS_KEYS in types package
 */
export type LIT_NETWORK_VALUES = (typeof LIT_NETWORK)[keyof typeof LIT_NETWORK];
/**
 * RPC URL by Network
 *
 * A mapping of network names to their corresponding RPC URLs.
 */
export declare const RPC_URL_BY_NETWORK: {
    [key in LIT_NETWORK_VALUES]: string;
};
/**
 * Mapping of network names to their corresponding relayer URLs.
 */
export declare const RELAYER_URL_BY_NETWORK: {
    [key in LIT_NETWORK_VALUES]: string;
};
/**
 * Mapping of network values to corresponding Metamask chain info.
 */
export declare const METAMASK_CHAIN_INFO_BY_NETWORK: Record<LIT_NETWORK_VALUES, typeof METAMASK_CHAIN_INFO.yellowstone>;
export declare const HTTP = "http://";
export declare const HTTPS = "https://";
/**
 * Mapping of network values to corresponding http protocol.
 */
export declare const HTTP_BY_NETWORK: Record<LIT_NETWORK_VALUES, typeof HTTP | typeof HTTPS>;
/**
 * Mapping of network values to their corresponding centralisation status.
 */
export declare const CENTRALISATION_BY_NETWORK: Record<LIT_NETWORK_VALUES, 'centralised' | 'decentralised' | 'unknown'>;
/**
 * Solana Chains supported by the LIT protocol.  Use the chain name as a key in this object.
 * @constant
 * @type { LITSVMChain }
 * @default
 */
export declare const LIT_SVM_CHAINS: LITChain<LITSVMChain>;
/**
 * Cosmos Chains supported by the LIT protocol.  Use the chain name as a key in this object.
 * @constant
 * @type { LITCosmosChain }
 * @default
 */
export declare const LIT_COSMOS_CHAINS: LITChain<LITCosmosChain>;
/**
 * All Chains supported by the LIT protocol.  Use the chain name as a key in this object.
 * @type { LITChain<LITEVMChain | LITSVMChain | LITCosmosChain> }
 */
export declare const ALL_LIT_CHAINS: LITChain<LITEVMChain | LITSVMChain | LITCosmosChain>;
/**
 * Local storage key constants
 */
export declare const LOCAL_STORAGE_KEYS: {
    AUTH_COSMOS_SIGNATURE: string;
    AUTH_SIGNATURE: string;
    AUTH_SOL_SIGNATURE: string;
    WEB3_PROVIDER: string;
    KEY_PAIR: string;
    SESSION_KEY: string;
    WALLET_SIGNATURE: string;
};
/**
 * Symmetric key algorithm parameters
 */
export declare const SYMM_KEY_ALGO_PARAMS: {
    name: string;
    length: number;
};
/**
 * Default node URLs for each LIT network
 * Note: Dynamic networks have no default node URLS; they are always
 * loaded from the chain during initialization
 */
export declare const LIT_NETWORKS: {
    [key in LIT_NETWORK_VALUES]: string[];
};
export declare const LIT_SESSION_KEY_URI = "lit:session:";
export declare const AUTH_METHOD_TYPE_IDS: {
    WEBAUTHN: number;
    DISCORD: number;
    GOOGLE: number;
    GOOGLE_JWT: number;
};
export declare const PKP_CLIENT_SUPPORTED_CHAINS: string[];
export declare const SIWE_DELEGATION_URI = "lit:capability:delegation";
export declare const LIT_ACTION_IPFS_HASH = "QmUjX8MW6StQ7NKNdaS6g4RMkvN5hcgtKmEi8Mca6oX4t3";
export declare const VMTYPE: {
    readonly EVM: "EVM";
    readonly SVM: "SVM";
    readonly CVM: "CVM";
};
export type VMTYPE_TYPE = keyof typeof VMTYPE;
export type VMTYPE_VALUES = (typeof VMTYPE)[keyof typeof VMTYPE];
export declare const LIT_CURVE: {
    readonly BLS: "BLS";
    readonly EcdsaK256: "K256";
    readonly EcdsaCaitSith: "ECDSA_CAIT_SITH";
    readonly EcdsaCAITSITHP256: "EcdsaCaitSithP256";
};
export type LIT_CURVE_TYPE = keyof typeof LIT_CURVE;
export type LIT_CURVE_VALUES = (typeof LIT_CURVE)[keyof typeof LIT_CURVE];
export declare const EITHER_TYPE: {
    readonly ERROR: "ERROR";
    readonly SUCCESS: "SUCCESS";
};
export type EITHER_TYPE_TYPE = keyof typeof EITHER_TYPE;
export type EITHER_TYPE_VALUES = (typeof EITHER_TYPE)[keyof typeof EITHER_TYPE];
export declare const AUTH_METHOD_TYPE: {
    readonly EthWallet: 1;
    readonly LitAction: 2;
    readonly WebAuthn: 3;
    readonly Discord: 4;
    readonly Google: 5;
    readonly GoogleJwt: 6;
    readonly AppleJwt: 8;
    readonly StytchOtp: 9;
    readonly StytchEmailFactorOtp: 10;
    readonly StytchSmsFactorOtp: 11;
    readonly StytchWhatsAppFactorOtp: 12;
    readonly StytchTotpFactorOtp: 13;
};
export type AUTH_METHOD_TYPE_TYPE = keyof typeof AUTH_METHOD_TYPE;
export type AUTH_METHOD_TYPE_VALUES = (typeof AUTH_METHOD_TYPE)[keyof typeof AUTH_METHOD_TYPE];
/**
 * @deprecated Will be removed - Use AUTH_METHOD_TYPE instead
 * Alias for AUTH_METHOD_TYPE. Added for backwards compatibility.
 * See {@link AUTH_METHOD_TYPE}
 */
export declare const AuthMethodType: {
    readonly EthWallet: 1;
    readonly LitAction: 2;
    readonly WebAuthn: 3;
    readonly Discord: 4;
    readonly Google: 5;
    readonly GoogleJwt: 6;
    readonly AppleJwt: 8;
    readonly StytchOtp: 9;
    readonly StytchEmailFactorOtp: 10;
    readonly StytchSmsFactorOtp: 11;
    readonly StytchWhatsAppFactorOtp: 12;
    readonly StytchTotpFactorOtp: 13;
};
export declare const AUTH_METHOD_SCOPE: {
    readonly NoPermissions: 0;
    readonly SignAnything: 1;
    readonly PersonalSign: 2;
};
export type AUTH_METHOD_SCOPE_TYPE = keyof typeof AUTH_METHOD_SCOPE;
export type AUTH_METHOD_SCOPE_VALUES = (typeof AUTH_METHOD_SCOPE)[keyof typeof AUTH_METHOD_SCOPE];
/**
 * @deprecated Will be removed - Use AUTH_METHOD_SCOPE instead
 * Alias for AUTH_METHOD_SCOPE. Added for backwards compatibility.
 * See {@link AUTH_METHOD_SCOPE}
 */
export declare const AuthMethodScope: {
    readonly NoPermissions: 0;
    readonly SignAnything: 1;
    readonly PersonalSign: 2;
};
export declare const PROVIDER_TYPE: {
    readonly Discord: "discord";
    readonly Google: "google";
    readonly EthWallet: "ethwallet";
    readonly WebAuthn: "webauthn";
    readonly Apple: "apple";
    readonly StytchOtp: "stytchOtp";
    readonly StytchEmailFactorOtp: "stytchEmailFactorOtp";
    readonly StytchSmsFactorOtp: "stytchSmsFactorOtp";
    readonly StytchWhatsAppFactorOtp: "stytchWhatsAppFactorOtp";
    readonly StytchTotpFactor: "stytchTotpFactor";
};
export type PROVIDER_TYPE_TYPE = keyof typeof PROVIDER_TYPE;
export type PROVIDER_TYPE_VALUES = (typeof PROVIDER_TYPE)[keyof typeof PROVIDER_TYPE];
/**
 * @deprecated Will be removed - Use PROVIDER_TYPE instead
 * Alias for PROVIDER_TYPE. Added for backwards compatibility.
 * See {@link PROVIDER_TYPE}
 */
export declare const ProviderType: {
    readonly Discord: "discord";
    readonly Google: "google";
    readonly EthWallet: "ethwallet";
    readonly WebAuthn: "webauthn";
    readonly Apple: "apple";
    readonly StytchOtp: "stytchOtp";
    readonly StytchEmailFactorOtp: "stytchEmailFactorOtp";
    readonly StytchSmsFactorOtp: "stytchSmsFactorOtp";
    readonly StytchWhatsAppFactorOtp: "stytchWhatsAppFactorOtp";
    readonly StytchTotpFactor: "stytchTotpFactor";
};
export declare const STAKING_STATES: {
    readonly Active: 0;
    readonly NextValidatorSetLocked: 1;
    readonly ReadyForNextEpoch: 2;
    readonly Unlocked: 3;
    readonly Paused: 4;
    readonly Restore: 5;
};
export type STAKING_STATES_TYPE = keyof typeof STAKING_STATES;
export type STAKING_STATES_VALUES = (typeof STAKING_STATES)[keyof typeof STAKING_STATES];
/**
 * @deprecated Will be removed - Use STAKING_STATES instead
 * Alias for STAKING_STATES. Added for backwards compatibility.
 * See {@link STAKING_STATES}
 */
export declare const StakingStates: {
    readonly Active: 0;
    readonly NextValidatorSetLocked: 1;
    readonly ReadyForNextEpoch: 2;
    readonly Unlocked: 3;
    readonly Paused: 4;
    readonly Restore: 5;
};
export declare const RELAY_AUTH_STATUS: {
    readonly InProgress: "InProgress";
    readonly Succeeded: "Succeeded";
    readonly Failed: "Failed";
};
export type RELAY_AUTH_STATUS_TYPE = keyof typeof RELAY_AUTH_STATUS;
export type RELAY_AUTH_STATUS_VALUES = (typeof RELAY_AUTH_STATUS)[keyof typeof RELAY_AUTH_STATUS];
/**
 * @deprecated Will be removed - Use RELAY_AUTH_STATUS instead
 * Alias for RELAY_AUTH_STATUS. Added for backwards compatibility.
 * See {@link RELAY_AUTH_STATUS}
 */
export declare const RelayAuthStatus: {
    readonly InProgress: "InProgress";
    readonly Succeeded: "Succeeded";
    readonly Failed: "Failed";
};
/**
 * Prefixes used for identifying various LIT resources.
 *
 * @description These resource prefixes are also used as valid IRI schemes.
 */
export declare const LIT_RESOURCE_PREFIX: {
    readonly AccessControlCondition: "lit-accesscontrolcondition";
    readonly PKP: "lit-pkp";
    readonly RLI: "lit-ratelimitincrease";
    readonly LitAction: "lit-litaction";
};
export type LIT_RESOURCE_PREFIX_TYPE = keyof typeof LIT_RESOURCE_PREFIX;
export type LIT_RESOURCE_PREFIX_VALUES = (typeof LIT_RESOURCE_PREFIX)[keyof typeof LIT_RESOURCE_PREFIX];
/**
 * @deprecated Will be removed - Use LIT_RESOURCE_PREFIX instead
 * Alias for LIT_RESOURCE_PREFIX. Added for backwards compatibility.
 * See {@link LIT_RESOURCE_PREFIX}
 */
export declare const LitResourcePrefix: {
    readonly AccessControlCondition: "lit-accesscontrolcondition";
    readonly PKP: "lit-pkp";
    readonly RLI: "lit-ratelimitincrease";
    readonly LitAction: "lit-litaction";
};
/**
 * User-facing abilities that can be granted to a session.
 */
export declare const LIT_ABILITY: {
    /**
     * This is the ability to process an encryption access control condition.
     * The resource will specify the corresponding hashed key value of the
     * access control condition.
     */
    readonly AccessControlConditionDecryption: "access-control-condition-decryption";
    /**
     * This is the ability to process a signing access control condition.
     * The resource will specify the corresponding hashed key value of the
     * access control condition.
     */
    readonly AccessControlConditionSigning: "access-control-condition-signing";
    /**
     * This is the ability to use a PKP for signing purposes. The resource will specify
     * the corresponding PKP token ID.
     */
    readonly PKPSigning: "pkp-signing";
    /**
     * This is the ability to use a Rate Limit Increase (Capacity Credits NFT) token during
     * authentication with the nodes. The resource will specify the corresponding
     * Capacity Credits NFT token ID.
     */
    readonly RateLimitIncreaseAuth: "rate-limit-increase-auth";
    /**
     * This is the ability to execute a Lit Action. The resource will specify the
     * corresponding Lit Action IPFS CID.
     */
    readonly LitActionExecution: "lit-action-execution";
};
export type LIT_ABILITY_TYPE = keyof typeof LIT_ABILITY;
export type LIT_ABILITY_VALUES = (typeof LIT_ABILITY)[keyof typeof LIT_ABILITY];
/**
 * @deprecated Will be removed - Use LIT_ABILITY instead
 * Alias for LIT_ABILITY. Added for backwards compatibility.
 * See {@link LIT_ABILITY}
 */
export declare const LitAbility: {
    /**
     * This is the ability to process an encryption access control condition.
     * The resource will specify the corresponding hashed key value of the
     * access control condition.
     */
    readonly AccessControlConditionDecryption: "access-control-condition-decryption";
    /**
     * This is the ability to process a signing access control condition.
     * The resource will specify the corresponding hashed key value of the
     * access control condition.
     */
    readonly AccessControlConditionSigning: "access-control-condition-signing";
    /**
     * This is the ability to use a PKP for signing purposes. The resource will specify
     * the corresponding PKP token ID.
     */
    readonly PKPSigning: "pkp-signing";
    /**
     * This is the ability to use a Rate Limit Increase (Capacity Credits NFT) token during
     * authentication with the nodes. The resource will specify the corresponding
     * Capacity Credits NFT token ID.
     */
    readonly RateLimitIncreaseAuth: "rate-limit-increase-auth";
    /**
     * This is the ability to execute a Lit Action. The resource will specify the
     * corresponding Lit Action IPFS CID.
     */
    readonly LitActionExecution: "lit-action-execution";
};
/**
 * LIT specific abilities mapped into the Recap specific terminology
 * of an 'ability'.
 */
export declare const LIT_RECAP_ABILITY: {
    readonly Decryption: "Decryption";
    readonly Signing: "Signing";
    readonly Auth: "Auth";
    readonly Execution: "Execution";
};
export type LIT_RECAP_ABILITY_TYPE = keyof typeof LIT_RECAP_ABILITY;
export type LIT_RECAP_ABILITY_VALUES = (typeof LIT_RECAP_ABILITY)[keyof typeof LIT_RECAP_ABILITY];
/**
 * @deprecated Will be removed - Use LIT_RECAP_ABILITY instead
 * Alias for LIT_RECAP_ABILITY. Added for backwards compatibility.
 * See {@link LIT_RECAP_ABILITY}
 */
export declare const LitRecapAbility: {
    readonly Decryption: "Decryption";
    readonly Signing: "Signing";
    readonly Auth: "Auth";
    readonly Execution: "Execution";
};
export declare const LIT_NAMESPACE: {
    readonly Auth: "Auth";
    readonly Threshold: "Threshold";
};
export type LIT_NAMESPACE_TYPE = keyof typeof LIT_NAMESPACE;
export type LIT_NAMESPACE_VALUES = (typeof LIT_NAMESPACE)[keyof typeof LIT_NAMESPACE];
/**
 * @deprecated Will be removed - Use LIT_NAMESPACE instead
 * Alias for LIT_NAMESPACE. Added for backwards compatibility.
 * See {@link LIT_NAMESPACE}
 */
export declare const LitNamespace: {
    readonly Auth: "Auth";
    readonly Threshold: "Threshold";
};
/**
 * SDK Logger levels
 */
export declare const LOG_LEVEL: {
    readonly INFO: 0;
    readonly DEBUG: 1;
    readonly WARN: 2;
    readonly ERROR: 3;
    readonly FATAL: 4;
    readonly TIMING_START: 5;
    readonly TIMING_END: 6;
    readonly OFF: -1;
};
export type LOG_LEVEL_TYPE = keyof typeof LOG_LEVEL;
export type LOG_LEVEL_VALUES = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];
/**
 * @deprecated Will be removed - Use LOG_LEVEL instead
 * Alias for LOG_LEVEL. Added for backwards compatibility.
 * See {@link LOG_LEVEL}
 */
export declare const LogLevel: {
    readonly INFO: 0;
    readonly DEBUG: 1;
    readonly WARN: 2;
    readonly ERROR: 3;
    readonly FATAL: 4;
    readonly TIMING_START: 5;
    readonly TIMING_END: 6;
    readonly OFF: -1;
};
export declare const FALLBACK_IPFS_GATEWAYS: string[];
