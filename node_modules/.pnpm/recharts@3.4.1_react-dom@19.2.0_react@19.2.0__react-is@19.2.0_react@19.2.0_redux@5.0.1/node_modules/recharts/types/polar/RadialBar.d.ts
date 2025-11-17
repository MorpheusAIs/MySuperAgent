import * as React from 'react';
import { ReactElement } from 'react';
import { Series } from 'victory-vendor/d3-shape';
import { Props as SectorProps } from '../shape/Sector';
import { ImplicitLabelListType } from '../component/LabelList';
import { BarPositionPosition } from '../util/ChartUtils';
import { ActiveShape, AnimationDuration, AnimationTiming, DataKey, LayoutType, LegendType, PolarViewBoxRequired, PresentationAttributesAdaptChildEvent, TickItem, TooltipType } from '../util/types';
import { BaseAxisWithScale } from '../state/selectors/axisSelectors';
import { ChartData } from '../state/chartDataSlice';
import { AxisId } from '../state/cartesianAxisSlice';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export type RadialBarDataItem = SectorProps & PolarViewBoxRequired & {
    value?: any;
    payload?: any;
    background?: SectorProps;
};
type RadialBarBackground = ActiveShape<SectorProps> & ZIndexable;
interface InternalRadialBarProps extends ZIndexable {
    className?: string;
    angleAxisId?: AxisId;
    radiusAxisId?: AxisId;
    startAngle?: number;
    endAngle?: number;
    shape?: ActiveShape<SectorProps, SVGPathElement>;
    activeShape?: ActiveShape<SectorProps, SVGPathElement>;
    dataKey: string | number | ((obj: any) => any);
    cornerRadius?: string | number;
    forceCornerRadius?: boolean;
    cornerIsExternal?: boolean;
    minPointSize?: number;
    /**
     * So in Bar, this can be a percent value - but that won't work in RadialBar. RadialBar: only numbers.
     */
    barSize?: number;
    maxBarSize?: number;
    data?: ReadonlyArray<RadialBarDataItem>;
    legendType?: LegendType;
    tooltipType?: TooltipType;
    hide?: boolean;
    label?: ImplicitLabelListType;
    stackId?: string | number;
    background?: RadialBarBackground;
    onAnimationStart?: () => void;
    onAnimationEnd?: () => void;
    isAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: AnimationDuration;
    animationEasing?: AnimationTiming;
}
export type RadialBarProps = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'ref'> & InternalRadialBarProps;
export declare function computeRadialBarDataItems({ displayedData, stackedData, dataStartIndex, stackedDomain, dataKey, baseValue, layout, radiusAxis, radiusAxisTicks, bandSize, pos, angleAxis, minPointSize, cx, cy, angleAxisTicks, cells, startAngle: rootStartAngle, endAngle: rootEndAngle, }: {
    displayedData: ChartData;
    stackedData: Series<Record<number, number>, DataKey<any>> | undefined;
    dataStartIndex: number;
    stackedDomain: ReadonlyArray<unknown> | null;
    dataKey: DataKey<any> | undefined;
    baseValue: number | unknown;
    layout: LayoutType;
    radiusAxis: BaseAxisWithScale;
    radiusAxisTicks: ReadonlyArray<TickItem> | undefined;
    bandSize: number;
    pos: BarPositionPosition;
    angleAxis: BaseAxisWithScale;
    minPointSize: number;
    cx: number;
    cy: number;
    angleAxisTicks: ReadonlyArray<TickItem> | undefined;
    cells: ReadonlyArray<ReactElement> | undefined;
    startAngle: number;
    endAngle: number;
}): ReadonlyArray<RadialBarDataItem>;
export declare function RadialBar(outsideProps: RadialBarProps): React.JSX.Element;
export declare namespace RadialBar {
    var displayName: string;
}
export {};
