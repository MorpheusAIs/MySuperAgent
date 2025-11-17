import * as React from 'react';
import { ReactElement, SVGAttributes, SVGProps } from 'react';
import { DataKey, Padding } from '../util/types';
import { OnBrushUpdate } from '../context/brushUpdateContext';
type BrushTravellerType = ReactElement<SVGElement> | ((props: TravellerProps) => ReactElement<SVGElement>);
type BrushTickFormatter = (value: any, index: number) => number | string;
interface BrushProps {
    x?: number;
    y?: number;
    dy?: number;
    width?: number;
    className?: string;
    ariaLabel?: string;
    height?: number;
    travellerWidth?: number;
    traveller?: BrushTravellerType;
    gap?: number;
    padding?: Padding;
    dataKey?: DataKey<any>;
    startIndex?: number;
    endIndex?: number;
    tickFormatter?: BrushTickFormatter;
    children?: ReactElement;
    onChange?: OnBrushUpdate;
    onDragEnd?: OnBrushUpdate;
    leaveTimeOut?: number;
    alwaysShowText?: boolean;
}
export type Props = Omit<SVGProps<SVGElement>, 'onChange' | 'onDragEnd' | 'ref'> & BrushProps;
type TravellerProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    stroke?: SVGAttributes<SVGElement>['stroke'];
};
export declare function Brush(outsideProps: Props): React.JSX.Element;
export declare namespace Brush {
    var displayName: string;
}
export {};
