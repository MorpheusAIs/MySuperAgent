export type PolarChartOptions = {
    cx: number | string;
    cy: number | string;
    startAngle: number;
    endAngle: number;
    innerRadius: number | string;
    outerRadius: number | string;
};
export declare const updatePolarOptions: import("@reduxjs/toolkit").ActionCreatorWithPayload<PolarChartOptions, "polarOptions/updatePolarOptions">;
export declare const polarOptionsReducer: import("redux").Reducer<PolarChartOptions | null>;
