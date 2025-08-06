/**
 * This file serves as a central location for all Lit node endpoints and their request/response interfaces & types.
 */
import { AuthMethod, AuthSig, MultipleAccessControlConditions } from '../interfaces';
import { AccessControlConditions, EvmContractConditions, SolRpcConditions, UnifiedAccessControlConditions } from '../types';
export interface JsonPKPClaimKeyRequest {
    authMethod: AuthMethod;
    credentialPublicKey?: string | null;
}
export interface SigningAccessControlConditionRequest extends MultipleAccessControlConditions {
    chain?: string;
    authSig?: AuthSig;
    iat?: number;
    exp?: number;
}
export interface EncryptionSignRequest {
    accessControlConditions?: AccessControlConditions[];
    evmContractConditions?: EvmContractConditions[];
    solRpcConditions?: SolRpcConditions[];
    unifiedAccessControlConditions?: UnifiedAccessControlConditions[];
    chain?: string | null;
    dataToEncryptHash: string;
    authSig: AuthSig;
    epoch: number;
}
