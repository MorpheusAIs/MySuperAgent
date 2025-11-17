import * as React from 'react';
import { AxisId } from '../state/cartesianAxisSlice';
import { ErrorBarDataPointFormatter } from '../cartesian/ErrorBar';
import { ErrorBarsSettings } from '../state/errorBarSlice';
type ErrorBarContextType<T> = {
    data: ReadonlyArray<T> | undefined;
    xAxisId: AxisId;
    yAxisId: AxisId;
    dataPointFormatter: ErrorBarDataPointFormatter;
    errorBarOffset: number;
};
export declare function SetErrorBarContext<T>(props: ErrorBarContextType<T> & {
    children: React.ReactNode;
}): React.JSX.Element;
export declare const useErrorBarContext: () => ErrorBarContextType<any>;
export declare function ReportErrorBarSettings(props: ErrorBarsSettings): null;
export {};
