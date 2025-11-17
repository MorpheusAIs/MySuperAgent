"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useYAxisDomain = exports.useYAxis = exports.useXAxisDomain = exports.useXAxis = exports.usePlotArea = exports.useOffset = exports.useActiveTooltipLabel = exports.useActiveTooltipDataPoints = void 0;
var _cartesianAxisSlice = require("./state/cartesianAxisSlice");
var _axisSelectors = require("./state/selectors/axisSelectors");
var _hooks = require("./state/hooks");
var _PanoramaContext = require("./context/PanoramaContext");
var _tooltipSelectors = require("./state/selectors/tooltipSelectors");
var _selectChartOffset = require("./state/selectors/selectChartOffset");
var _selectPlotArea = require("./state/selectors/selectPlotArea");
var useXAxis = xAxisId => {
  var isPanorama = (0, _PanoramaContext.useIsPanorama)();
  return (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectAxisWithScale)(state, 'xAxis', xAxisId, isPanorama));
};
exports.useXAxis = useXAxis;
var useYAxis = yAxisId => {
  var isPanorama = (0, _PanoramaContext.useIsPanorama)();
  return (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectAxisWithScale)(state, 'yAxis', yAxisId, isPanorama));
};

/**
 * Returns the active tooltip label. The label is one of the values from the chart data,
 * and is used to display in the tooltip content.
 *
 * Returns undefined if there is no active user interaction or if used outside a chart context
 *
 * @returns string | undefined
 */
exports.useYAxis = useYAxis;
var useActiveTooltipLabel = () => {
  return (0, _hooks.useAppSelector)(_tooltipSelectors.selectActiveLabel);
};

/**
 * Offset defines the blank space between the chart and the plot area.
 * This blank space is occupied by supporting elements like axes, legends, and brushes.
 * This also includes any margins that might be applied to the chart.
 * If you are interested in the margin alone, use `useMargin` instead.
 *
 * @returns Offset of the chart in pixels, or undefined if used outside a chart context.
 */
exports.useActiveTooltipLabel = useActiveTooltipLabel;
var useOffset = () => {
  return (0, _hooks.useAppSelector)(_selectChartOffset.selectChartOffset);
};

/**
 * Plot area is the area where the actual chart data is rendered.
 * This means: bars, lines, scatter points, etc.
 *
 * The plot area is calculated based on the chart dimensions and the offset.
 *
 * @returns Plot area of the chart in pixels, or undefined if used outside a chart context.
 */
exports.useOffset = useOffset;
var usePlotArea = () => {
  return (0, _hooks.useAppSelector)(_selectPlotArea.selectPlotArea);
};

/**
 * Returns the currently active data points being displayed in the Tooltip.
 * Active means that it is currently visible; this hook will return `undefined` if there is no current interaction.
 *
 * This follows the `<Tooltip />` props, if the Tooltip element is present in the chart.
 * If there is no `<Tooltip />` then this hook will follow the default Tooltip props.
 *
 * Data point is whatever you pass as an input to the chart using the `data={}` prop.
 *
 * This returns an array because a chart can have multiple graphical items in it (multiple Lines for example)
 * and tooltip with `shared={true}` will display all items at the same time.
 *
 * Returns undefined when used outside a chart context.
 *
 * @returns Data points that are currently visible in a Tooltip
 */
exports.usePlotArea = usePlotArea;
var useActiveTooltipDataPoints = () => {
  return (0, _hooks.useAppSelector)(_tooltipSelectors.selectActiveTooltipDataPoints);
};

/**
 * Returns the calculated domain of an X-axis.
 *
 * The domain can be numerical: `[min, max]`, or categorical: `['a', 'b', 'c']`.
 *
 * The type of the domain is defined by the `type` prop of the XAxis.
 *
 * The values of the domain are calculated based on the data and the `dataKey` of the axis.
 *
 * If the chart has a Brush, the domain will be filtered to the brushed indexes if the hook is used outside a Brush context,
 * and the full domain will be returned if the hook is used inside a Brush context.
 *
 * @param xAxisId The `xAxisId` of the X-axis. Defaults to `0` if not provided.
 * @returns The domain of the X-axis, or `undefined` if it cannot be calculated or if used outside a chart context.
 */
exports.useActiveTooltipDataPoints = useActiveTooltipDataPoints;
var useXAxisDomain = exports.useXAxisDomain = function useXAxisDomain() {
  var xAxisId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _cartesianAxisSlice.defaultAxisId;
  var isPanorama = (0, _PanoramaContext.useIsPanorama)();
  return (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectAxisDomain)(state, 'xAxis', xAxisId, isPanorama));
};

/**
 * Returns the calculated domain of a Y-axis.
 *
 * The domain can be numerical: `[min, max]`, or categorical: `['a', 'b', 'c']`.
 *
 * The type of the domain is defined by the `type` prop of the YAxis.
 *
 * The values of the domain are calculated based on the data and the `dataKey` of the axis.
 *
 * Does not interact with Brushes, as Y-axes do not support brushing.
 *
 * @param yAxisId The `yAxisId` of the Y-axis. Defaults to `0` if not provided.
 * @returns The domain of the Y-axis, or `undefined` if it cannot be calculated or if used outside a chart context.
 */
var useYAxisDomain = exports.useYAxisDomain = function useYAxisDomain() {
  var yAxisId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _cartesianAxisSlice.defaultAxisId;
  var isPanorama = (0, _PanoramaContext.useIsPanorama)();
  return (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectAxisDomain)(state, 'yAxis', yAxisId, isPanorama));
};