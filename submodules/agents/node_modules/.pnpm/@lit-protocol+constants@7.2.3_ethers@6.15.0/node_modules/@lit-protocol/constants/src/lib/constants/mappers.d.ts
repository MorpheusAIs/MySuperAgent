import { datilDev, datilTest, datil } from '@lit-protocol/contracts';
import { LIT_NETWORK_VALUES } from './constants';
/**
 * Mapping of network context by network value.
 */
export declare const NETWORK_CONTEXT_BY_NETWORK: {
    [key in LIT_NETWORK_VALUES]: typeof datilDev | typeof datilTest | typeof datil;
};
export declare const GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK: {
    [key in LIT_NETWORK_VALUES]: boolean;
};
