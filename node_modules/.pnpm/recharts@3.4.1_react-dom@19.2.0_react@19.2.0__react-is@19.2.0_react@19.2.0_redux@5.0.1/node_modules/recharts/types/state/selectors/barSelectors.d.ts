import { ReactElement } from 'react';
import { RechartsRootState } from '../store';
import { AxisId } from '../cartesianAxisSlice';
import { BarPositionPosition, StackId } from '../../util/ChartUtils';
import { DataKey } from '../../util/types';
import { BarRectangleItem } from '../../cartesian/Bar';
import { AllStackGroups, StackSeries } from '../../util/stacks/stackTypes';
import { MaybeStackedGraphicalItem } from '../types/StackedGraphicalItem';
import { BarSettings } from '../types/BarSettings';
import { GraphicalItemId } from '../graphicalItemsSlice';
export declare const selectMaxBarSize: (_state: RechartsRootState, _xAxisId: AxisId, _yAxisId: AxisId, _isPanorama: boolean, id: GraphicalItemId) => number | undefined;
export declare const selectAllVisibleBars: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean) => ReadonlyArray<BarSettings>;
type BarCategory = {
    stackId: StackId | undefined;
    /**
     * List of dataKeys of items stacked at this position.
     * All of these Bars are either sharing the same stackId,
     * or this is an array with one Bar because it has no stackId defined.
     *
     * This structure limits us to having one dataKey only once per stack which I think is reasonable.
     * People who want to have the same data twice can duplicate their data to have two distinct dataKeys.
     */
    dataKeys: ReadonlyArray<DataKey<any>>;
    /**
     * Width (in horizontal chart) or height (in vertical chart) of this stack of items
     */
    barSize: number | undefined;
};
export type SizeList = ReadonlyArray<BarCategory>;
export declare const selectBarCartesianAxisSize: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId) => number | undefined;
export declare const combineBarSizeList: (allBars: ReadonlyArray<MaybeStackedGraphicalItem>, globalSize: number | undefined, totalSize: number | undefined) => SizeList | undefined;
export declare const selectBarSizeList: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean, id: GraphicalItemId) => SizeList | undefined;
export declare const selectBarBandSize: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean, id: GraphicalItemId) => number | undefined;
export declare const selectAxisBandSize: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean) => number | undefined;
export type BarWithPosition = {
    stackId: StackId | undefined;
    /**
     * List of dataKeys of items stacked at this position.
     * All of these Bars are either sharing the same stackId,
     * or this is an array with one Bar because it has no stackId defined.
     *
     * This structure limits us to having one dataKey only once per stack which I think is reasonable.
     * People who want to have the same data twice can duplicate their data to have two distinct dataKeys.
     */
    dataKeys: ReadonlyArray<DataKey<any>>;
    /**
     * Position of this stack in absolute pixels measured from the start of the chart
     */
    position: BarPositionPosition;
};
export declare const combineAllBarPositions: (sizeList: SizeList, globalMaxBarSize: number, barGap: string | number, barCategoryGap: string | number, barBandSize: number, bandSize: number, childMaxBarSize: number | undefined) => ReadonlyArray<BarWithPosition> | undefined;
export declare const selectAllBarPositions: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean, id: GraphicalItemId) => ReadonlyArray<BarWithPosition> | undefined;
export declare const selectBarPosition: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean, _id: GraphicalItemId) => BarPositionPosition | undefined;
export declare const combineStackedData: (stackGroups: AllStackGroups | undefined, barSettings: MaybeStackedGraphicalItem | undefined) => StackSeries | undefined;
export declare const selectBarRectangles: (state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean, id: GraphicalItemId, cells: ReadonlyArray<ReactElement> | undefined) => ReadonlyArray<BarRectangleItem> | undefined;
export {};
