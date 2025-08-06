import { LitError } from '../errors';
import { IEitherSuccess, IEitherError } from '../interfaces/i-errors';
/**
 *
 * This method should be used when there's an expected error
 *
 * @param error is the error encountered
 * @returns { IEither }
 */
export declare function ELeft(error: LitError): IEitherError;
/**
 *
 * This method should be used when there's an expected success outcome
 *
 * @param result is the successful return value
 * @returns
 */
export declare function ERight<T>(result: T): IEitherSuccess<T>;
