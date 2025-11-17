import { RechartsRootState } from '../store';
/**
 * angle, radius, X, Y, and Z axes all have domain and range and scale and associated settings
 */
export type XorYorZType = 'xAxis' | 'yAxis' | 'zAxis' | 'radiusAxis' | 'angleAxis';
/**
 * X and Y axes have ticks. Z axis is never displayed and so it lacks ticks
 * and tick settings.
 */
export type XorYType = 'xAxis' | 'yAxis' | 'angleAxis' | 'radiusAxis';
export declare const selectTooltipAxisType: (state: RechartsRootState) => XorYType;
