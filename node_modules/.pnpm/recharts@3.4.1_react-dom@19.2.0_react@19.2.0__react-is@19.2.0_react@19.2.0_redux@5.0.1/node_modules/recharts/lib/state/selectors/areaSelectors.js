"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectGraphicalItemStackedData = exports.selectArea = void 0;
var _reselect = require("reselect");
var _Area = require("../../cartesian/Area");
var _axisSelectors = require("./axisSelectors");
var _chartLayoutContext = require("../../context/chartLayoutContext");
var _dataSelectors = require("./dataSelectors");
var _ChartUtils = require("../../util/ChartUtils");
var _getStackSeriesIdentifier = require("../../util/stacks/getStackSeriesIdentifier");
var _rootPropsSelectors = require("./rootPropsSelectors");
var selectXAxisWithScale = (state, xAxisId, _yAxisId, isPanorama) => (0, _axisSelectors.selectAxisWithScale)(state, 'xAxis', xAxisId, isPanorama);
var selectXAxisTicks = (state, xAxisId, _yAxisId, isPanorama) => (0, _axisSelectors.selectTicksOfGraphicalItem)(state, 'xAxis', xAxisId, isPanorama);
var selectYAxisWithScale = (state, _xAxisId, yAxisId, isPanorama) => (0, _axisSelectors.selectAxisWithScale)(state, 'yAxis', yAxisId, isPanorama);
var selectYAxisTicks = (state, _xAxisId, yAxisId, isPanorama) => (0, _axisSelectors.selectTicksOfGraphicalItem)(state, 'yAxis', yAxisId, isPanorama);
var selectBandSize = (0, _reselect.createSelector)([_chartLayoutContext.selectChartLayout, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks], (layout, xAxis, yAxis, xAxisTicks, yAxisTicks) => {
  if ((0, _ChartUtils.isCategoricalAxis)(layout, 'xAxis')) {
    return (0, _ChartUtils.getBandSizeOfAxis)(xAxis, xAxisTicks, false);
  }
  return (0, _ChartUtils.getBandSizeOfAxis)(yAxis, yAxisTicks, false);
});
var pickAreaId = (_state, _xAxisId, _yAxisId, _isPanorama, id) => id;

/*
 * There is a race condition problem because we read some data from props and some from the state.
 * The state is updated through a dispatch and is one render behind,
 * and so we have this weird one tick render where the displayedData in one selector have the old dataKey
 * but the new dataKey in another selector.
 *
 * A proper fix is to either move everything into the state, or read the dataKey always from props
 * - but this is a smaller change.
 */
var selectSynchronisedAreaSettings = (0, _reselect.createSelector)([_axisSelectors.selectUnfilteredCartesianItems, pickAreaId], (graphicalItems, id) => graphicalItems.filter(item => item.type === 'area').find(item => item.id === id));
var selectGraphicalItemStackedData = (state, xAxisId, yAxisId, isPanorama, id) => {
  var _stackGroups$stackId;
  var areaSettings = selectSynchronisedAreaSettings(state, xAxisId, yAxisId, isPanorama, id);
  if (areaSettings == null) {
    return undefined;
  }
  var layout = (0, _chartLayoutContext.selectChartLayout)(state);
  var isXAxisCategorical = (0, _ChartUtils.isCategoricalAxis)(layout, 'xAxis');
  var stackGroups;
  if (isXAxisCategorical) {
    stackGroups = (0, _axisSelectors.selectStackGroups)(state, 'yAxis', yAxisId, isPanorama);
  } else {
    stackGroups = (0, _axisSelectors.selectStackGroups)(state, 'xAxis', xAxisId, isPanorama);
  }
  if (stackGroups == null) {
    return undefined;
  }
  var {
    stackId
  } = areaSettings;
  var stackSeriesIdentifier = (0, _getStackSeriesIdentifier.getStackSeriesIdentifier)(areaSettings);
  if (stackId == null || stackSeriesIdentifier == null) {
    return undefined;
  }
  var groups = (_stackGroups$stackId = stackGroups[stackId]) === null || _stackGroups$stackId === void 0 ? void 0 : _stackGroups$stackId.stackedData;
  return groups === null || groups === void 0 ? void 0 : groups.find(v => v.key === stackSeriesIdentifier);
};
exports.selectGraphicalItemStackedData = selectGraphicalItemStackedData;
var selectArea = exports.selectArea = (0, _reselect.createSelector)([_chartLayoutContext.selectChartLayout, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks, selectGraphicalItemStackedData, _dataSelectors.selectChartDataWithIndexesIfNotInPanorama, selectBandSize, selectSynchronisedAreaSettings, _rootPropsSelectors.selectChartBaseValue], (layout, xAxis, yAxis, xAxisTicks, yAxisTicks, stackedData, _ref, bandSize, areaSettings, chartBaseValue) => {
  var {
    chartData,
    dataStartIndex,
    dataEndIndex
  } = _ref;
  if (areaSettings == null || layout !== 'horizontal' && layout !== 'vertical' || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || xAxisTicks.length === 0 || yAxisTicks.length === 0 || bandSize == null) {
    return undefined;
  }
  var {
    data
  } = areaSettings;
  var displayedData;
  if (data && data.length > 0) {
    displayedData = data;
  } else {
    displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
  }
  if (displayedData == null) {
    return undefined;
  }
  return (0, _Area.computeArea)({
    layout,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    dataStartIndex,
    areaSettings,
    stackedData,
    displayedData,
    chartBaseValue,
    bandSize
  });
});