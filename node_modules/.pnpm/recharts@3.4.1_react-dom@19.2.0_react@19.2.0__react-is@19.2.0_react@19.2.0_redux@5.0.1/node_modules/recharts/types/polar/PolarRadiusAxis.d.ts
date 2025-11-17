import * as React from 'react';
import { FunctionComponent } from 'react';
import { BaseAxisProps, PresentationAttributesAdaptChildEvent, TickItem } from '../util/types';
import { defaultPolarRadiusAxisProps } from './defaultPolarRadiusAxisProps';
import { RequiresDefaultProps } from '../util/resolveDefaultProps';
import { ZIndexable } from '../zIndex/ZIndexLayer';
type TickOrientation = 'left' | 'right' | 'middle';
export interface PolarRadiusAxisProps extends Omit<BaseAxisProps, 'unit'>, ZIndexable {
    cx?: number;
    cy?: number;
    radiusAxisId?: string | number;
    angle?: number;
    orientation?: TickOrientation;
    ticks?: ReadonlyArray<TickItem>;
    reversed?: boolean;
}
type AxisSvgProps = Omit<PresentationAttributesAdaptChildEvent<any, SVGTextElement>, 'scale' | 'type'>;
export type Props = AxisSvgProps & PolarRadiusAxisProps;
type PropsWithDefaults = RequiresDefaultProps<Props, typeof defaultPolarRadiusAxisProps>;
export declare const PolarRadiusAxisWrapper: FunctionComponent<PropsWithDefaults>;
export declare function PolarRadiusAxis(outsideProps: Props): React.JSX.Element;
export declare namespace PolarRadiusAxis {
    var displayName: string;
}
export {};
