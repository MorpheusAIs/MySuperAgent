/**
 * @fileOverview Curve
 */
import * as React from 'react';
import { Ref } from 'react';
import { CurveFactory } from 'victory-vendor/d3-shape';
import { LayoutType, PresentationAttributesWithProps, NullableCoordinate } from '../util/types';
export type CurveType = 'basis' | 'basisClosed' | 'basisOpen' | 'bumpX' | 'bumpY' | 'bump' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter' | CurveFactory;
interface CurveProps {
    className?: string;
    type?: CurveType;
    layout?: LayoutType;
    baseLine?: number | ReadonlyArray<NullableCoordinate>;
    points?: ReadonlyArray<NullableCoordinate>;
    connectNulls?: boolean;
    path?: string;
    pathRef?: Ref<SVGPathElement>;
}
export type Props = Omit<PresentationAttributesWithProps<CurveProps, SVGPathElement>, 'type' | 'points'> & CurveProps;
type GetPathProps = Pick<Props, 'type' | 'points' | 'baseLine' | 'layout' | 'connectNulls'>;
/**
 * Calculate the path of curve. Returns null if points is an empty array.
 * @return path or null
 */
export declare const getPath: ({ type, points, baseLine, layout, connectNulls, }: GetPathProps) => string | null;
export declare const Curve: React.FC<Props>;
export {};
