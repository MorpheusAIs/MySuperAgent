import * as React from 'react';
import { FunctionComponent, ReactElement, SVGProps } from 'react';
import { Props as TextProps } from '../component/Text';
import { AxisDomain, DataKey, PresentationAttributesAdaptChildEvent, ScaleType, TickItem } from '../util/types';
import { RechartsScale } from '../util/ChartUtils';
import { defaultPolarAngleAxisProps } from './defaultPolarAngleAxisProps';
import { RequiresDefaultProps } from '../util/resolveDefaultProps';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export interface PolarAngleAxisProps extends ZIndexable {
    allowDecimals?: boolean;
    domain?: AxisDomain;
    allowDuplicatedCategory?: boolean;
    angleAxisId?: string | number;
    axisLineType?: 'polygon' | 'circle';
    ticks?: ReadonlyArray<TickItem>;
    orientation?: 'inner' | 'outer';
    axisLine?: boolean | SVGProps<SVGLineElement>;
    tickSize?: number;
    tickCount?: number;
    tickLine?: boolean | SVGProps<SVGLineElement>;
    tickFormatter?: (value: any, index: number) => string;
    reversed?: boolean;
    dataKey?: DataKey<any>;
    tick?: SVGProps<SVGTextElement> | ReactElement<SVGElement> | ((props: TickItemTextProps) => ReactElement<SVGElement>) | boolean;
    scale?: ScaleType | RechartsScale;
    type?: 'category' | 'number';
}
type AxisSvgProps = Omit<PresentationAttributesAdaptChildEvent<any, SVGTextElement>, 'scale' | 'type'>;
export type Props = AxisSvgProps & PolarAngleAxisProps;
type PropsWithDefaults = RequiresDefaultProps<Props, typeof defaultPolarAngleAxisProps>;
export type TickItemTextProps = TextProps & {
    index: number;
    payload: any;
};
export declare const PolarAngleAxisWrapper: FunctionComponent<PropsWithDefaults>;
export declare function PolarAngleAxis(outsideProps: Props): React.ReactNode;
export declare namespace PolarAngleAxis {
    var displayName: string;
}
export {};
