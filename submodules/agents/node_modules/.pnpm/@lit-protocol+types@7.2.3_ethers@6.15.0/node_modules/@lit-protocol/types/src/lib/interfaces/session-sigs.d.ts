import { AuthSig } from '../interfaces';
export interface ParsedSignedMessage {
    URI?: string;
    Version?: string;
    'Chain ID'?: string;
    Nonce?: string;
    'Issued At'?: string;
    /**
     * Inner expiration
     */
    'Expiration Time'?: string;
    Resources?: string[];
    /**
     * Outer expiration
     */
    expiration?: string;
    [key: string]: unknown;
}
export interface ParsedSessionMessage extends ParsedSignedMessage {
    capabilities: Capability[];
}
export interface Capability extends AuthSig {
    parsedSignedMessage?: ParsedSignedMessage;
}
