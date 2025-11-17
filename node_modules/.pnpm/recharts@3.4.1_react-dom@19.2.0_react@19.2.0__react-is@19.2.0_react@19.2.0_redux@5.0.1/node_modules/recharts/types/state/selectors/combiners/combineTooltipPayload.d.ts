import { TooltipIndex, TooltipPayload, TooltipPayloadConfiguration, TooltipPayloadSearcher } from '../../tooltipSlice';
import { ChartDataState } from '../../chartDataSlice';
import { DataKey, TooltipEventType } from '../../../util/types';
export declare const combineTooltipPayload: (tooltipPayloadConfigurations: ReadonlyArray<TooltipPayloadConfiguration>, activeIndex: TooltipIndex, chartDataState: ChartDataState, tooltipAxisDataKey: DataKey<any> | undefined, activeLabel: string | undefined, tooltipPayloadSearcher: TooltipPayloadSearcher | undefined, tooltipEventType: TooltipEventType | undefined) => TooltipPayload | undefined;
