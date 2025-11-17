import { AppliedChartData, ChartData } from '../chartDataSlice';
import { RechartsRootState } from '../store';
import { AxisId, BaseCartesianAxis } from '../cartesianAxisSlice';
import { AppliedChartDataWithErrorDomain } from './axisSelectors';
import { PolarGraphicalItemSettings } from '../graphicalItemsSlice';
import { CategoricalDomain, NumberDomain } from '../../util/types';
export type PolarAxisType = 'angleAxis' | 'radiusAxis';
export declare const selectUnfilteredPolarItems: (state: RechartsRootState) => readonly PolarGraphicalItemSettings[];
export declare const selectPolarItemsSettings: (state: RechartsRootState, axisType: PolarAxisType, polarAxisId: AxisId) => ReadonlyArray<PolarGraphicalItemSettings>;
export declare const selectPolarDisplayedData: (state: RechartsRootState, axisType: PolarAxisType, polarAxisId: AxisId) => ChartData | undefined;
export declare const selectPolarAppliedValues: (state: RechartsRootState, axisType: PolarAxisType, axisId: AxisId) => AppliedChartData;
export declare const selectAllPolarAppliedNumericalValues: (state: RechartsRootState, axisType: PolarAxisType, axisId: AxisId) => ReadonlyArray<AppliedChartDataWithErrorDomain>;
export declare const selectPolarAxisDomain: (state: RechartsRootState, axisType: PolarAxisType, polarAxisId: AxisId) => NumberDomain | CategoricalDomain | undefined;
export declare const selectPolarNiceTicks: ((state: import("redux").EmptyObject & {
    brush: import("../brushSlice").BrushSettings;
    cartesianAxis: {
        xAxis: Record<AxisId, import("../cartesianAxisSlice").XAxisSettings>;
        yAxis: Record<AxisId, import("../cartesianAxisSlice").YAxisSettings>;
        zAxis: Record<AxisId, import("../cartesianAxisSlice").ZAxisSettings>;
    };
    chartData: import("../chartDataSlice").ChartDataState;
    errorBars: import("../errorBarSlice").ErrorBarsState;
    graphicalItems: import("../graphicalItemsSlice").GraphicalItemsState;
    layout: {
        layoutType: import("../../util/types").LayoutType;
        width: number;
        height: number;
        margin: import("../../util/types").Margin;
        scale: number;
    };
    legend: {
        settings: import("../legendSlice").LegendSettings;
        size: import("../../util/types").Size;
        payload: ReadonlyArray<ReadonlyArray<import("../..").LegendPayload>>;
    };
    options: import("../optionsSlice").ChartOptions;
    polarAxis: {
        radiusAxis: Record<AxisId, import("../polarAxisSlice").RadiusAxisSettings>;
        angleAxis: Record<AxisId, import("../polarAxisSlice").AngleAxisSettings>;
    };
    polarOptions: import("../polarOptionsSlice").PolarChartOptions | null;
    referenceElements: {
        dots: ReadonlyArray<import("../referenceElementsSlice").ReferenceDotSettings>;
        areas: ReadonlyArray<import("../referenceElementsSlice").ReferenceAreaSettings>;
        lines: ReadonlyArray<import("../referenceElementsSlice").ReferenceLineSettings>;
    };
    rootProps: import("../rootPropsSlice").UpdatableChartOptions;
    tooltip: import("../tooltipSlice").TooltipState;
    zIndex: {
        zIndexMap: Record<number, {
            elementId: string | undefined;
            panoramaElementId: string | undefined;
            consumers: number;
        }>;
    };
}, axisType: "radiusAxis" | "angleAxis", polarAxisId: AxisId) => readonly number[] | undefined) & {
    clearCache: () => void;
    resultsCount: () => number;
    resetResultsCount: () => void;
} & {
    resultFunc: (resultFuncArgs_0: NumberDomain | CategoricalDomain | undefined, resultFuncArgs_1: BaseCartesianAxis, resultFuncArgs_2: string | undefined) => readonly number[] | undefined;
    memoizedResultFunc: ((resultFuncArgs_0: NumberDomain | CategoricalDomain | undefined, resultFuncArgs_1: BaseCartesianAxis, resultFuncArgs_2: string | undefined) => readonly number[] | undefined) & {
        clearCache: () => void;
        resultsCount: () => number;
        resetResultsCount: () => void;
    };
    lastResult: () => readonly number[] | undefined;
    dependencies: [(state: RechartsRootState, axisType: PolarAxisType, polarAxisId: AxisId) => NumberDomain | CategoricalDomain | undefined, (state: RechartsRootState, axisType: import("./selectTooltipAxisType").XorYorZType, axisId: AxisId) => BaseCartesianAxis, (state: RechartsRootState, axisType: import("./selectTooltipAxisType").XorYorZType, axisId: AxisId) => string | undefined];
    recomputations: () => number;
    resetRecomputations: () => void;
    dependencyRecomputations: () => number;
    resetDependencyRecomputations: () => void;
} & {
    argsMemoize: typeof import("reselect").weakMapMemoize;
    memoize: typeof import("reselect").weakMapMemoize;
};
export declare const selectPolarAxisDomainIncludingNiceTicks: (state: RechartsRootState, axisType: PolarAxisType, polarAxisId: AxisId) => NumberDomain | CategoricalDomain | undefined;
