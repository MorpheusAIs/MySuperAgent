import { RechartsRootState } from '../state/store';
/**
 * Given a zIndex, returns the corresponding portal element ID.
 * If no zIndex is provided or if the zIndex is not registered, returns undefined.
 *
 * It also returns undefined in case the z-index portal has not been rendered yet.
 */
export declare const selectZIndexPortalId: (state: RechartsRootState, zIndex: number | undefined, isPanorama: boolean) => string | undefined;
export declare const selectAllRegisteredZIndexes: ((state: import("redux").EmptyObject & {
    brush: import("../state/brushSlice").BrushSettings;
    cartesianAxis: {
        xAxis: Record<import("../state/cartesianAxisSlice").AxisId, import("../state/cartesianAxisSlice").XAxisSettings>;
        yAxis: Record<import("../state/cartesianAxisSlice").AxisId, import("../state/cartesianAxisSlice").YAxisSettings>;
        zAxis: Record<import("../state/cartesianAxisSlice").AxisId, import("../state/cartesianAxisSlice").ZAxisSettings>;
    };
    chartData: import("../state/chartDataSlice").ChartDataState;
    errorBars: import("../state/errorBarSlice").ErrorBarsState;
    graphicalItems: import("../state/graphicalItemsSlice").GraphicalItemsState;
    layout: {
        layoutType: import("../util/types").LayoutType;
        width: number;
        height: number;
        margin: import("../util/types").Margin;
        scale: number;
    };
    legend: {
        settings: import("../state/legendSlice").LegendSettings;
        size: import("../util/types").Size;
        payload: ReadonlyArray<ReadonlyArray<import("..").LegendPayload>>;
    };
    options: import("../state/optionsSlice").ChartOptions;
    polarAxis: {
        radiusAxis: Record<import("../state/cartesianAxisSlice").AxisId, import("../state/polarAxisSlice").RadiusAxisSettings>;
        angleAxis: Record<import("../state/cartesianAxisSlice").AxisId, import("../state/polarAxisSlice").AngleAxisSettings>;
    };
    polarOptions: import("../state/polarOptionsSlice").PolarChartOptions | null;
    referenceElements: {
        dots: ReadonlyArray<import("../state/referenceElementsSlice").ReferenceDotSettings>;
        areas: ReadonlyArray<import("../state/referenceElementsSlice").ReferenceAreaSettings>;
        lines: ReadonlyArray<import("../state/referenceElementsSlice").ReferenceLineSettings>;
    };
    rootProps: import("../state/rootPropsSlice").UpdatableChartOptions;
    tooltip: import("../state/tooltipSlice").TooltipState;
    zIndex: {
        zIndexMap: Record<number, {
            elementId: string | undefined;
            panoramaElementId: string | undefined;
            consumers: number;
        }>;
    };
}) => number[]) & {
    clearCache: () => void;
    resultsCount: () => number;
    resetResultsCount: () => void;
} & {
    resultFunc: (resultFuncArgs_0: Record<number, {
        elementId: string | undefined;
        panoramaElementId: string | undefined;
        consumers: number;
    }>) => number[];
    memoizedResultFunc: ((resultFuncArgs_0: Record<number, {
        elementId: string | undefined;
        panoramaElementId: string | undefined;
        consumers: number;
    }>) => number[]) & {
        clearCache: () => void;
        resultsCount: () => number;
        resetResultsCount: () => void;
    };
    lastResult: () => number[];
    dependencies: [(state: RechartsRootState) => Record<number, {
        elementId: string | undefined;
        panoramaElementId: string | undefined;
        consumers: number;
    }>];
    recomputations: () => number;
    resetRecomputations: () => void;
    dependencyRecomputations: () => number;
    resetDependencyRecomputations: () => void;
} & {
    argsMemoize: typeof import("reselect").weakMapMemoize;
    memoize: typeof import("reselect").weakMapMemoize;
};
