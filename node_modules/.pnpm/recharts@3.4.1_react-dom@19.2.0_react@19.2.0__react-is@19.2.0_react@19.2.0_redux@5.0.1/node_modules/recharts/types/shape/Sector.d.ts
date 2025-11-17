import * as React from 'react';
import { SVGProps } from 'react';
import { GeometrySectorWithCornerRadius } from '../util/types';
interface SectorProps extends GeometrySectorWithCornerRadius {
    className?: string;
}
/**
 * SVG cx, cy are `string | number | undefined`, but internally we use `number` so let's
 * override the types here.
 */
export type Props = Omit<SVGProps<SVGPathElement>, 'cx' | 'cy' | 'dangerouslySetInnerHTML'> & Partial<SectorProps>;
export declare const Sector: React.FC<Props>;
export {};
