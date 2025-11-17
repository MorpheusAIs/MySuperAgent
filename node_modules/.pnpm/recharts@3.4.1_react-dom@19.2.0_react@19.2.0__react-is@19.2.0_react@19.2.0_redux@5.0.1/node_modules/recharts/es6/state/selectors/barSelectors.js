function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import { createSelector } from 'reselect';
import { selectAxisWithScale, selectCartesianAxisSize, selectStackGroups, selectTicksOfGraphicalItem, selectUnfilteredCartesianItems } from './axisSelectors';
import { getPercentValue, isNullish } from '../../util/DataUtils';
import { getBandSizeOfAxis } from '../../util/ChartUtils';
import { computeBarRectangles } from '../../cartesian/Bar';
import { selectChartLayout } from '../../context/chartLayoutContext';
import { selectChartDataWithIndexesIfNotInPanorama } from './dataSelectors';
import { selectAxisViewBox, selectChartOffsetInternal } from './selectChartOffsetInternal';
import { selectBarCategoryGap, selectBarGap, selectRootBarSize, selectRootMaxBarSize } from './rootPropsSelectors';
import { isWellBehavedNumber } from '../../util/isWellBehavedNumber';
import { getStackSeriesIdentifier } from '../../util/stacks/getStackSeriesIdentifier';
import { isStacked } from '../types/StackedGraphicalItem';
var pickXAxisId = (_state, xAxisId) => xAxisId;
var pickYAxisId = (_state, _xAxisId, yAxisId) => yAxisId;
var pickIsPanorama = (_state, _xAxisId, _yAxisId, isPanorama) => isPanorama;
var pickBarId = (_state, _xAxisId, _yAxisId, _isPanorama, id) => id;
var selectSynchronisedBarSettings = createSelector([selectUnfilteredCartesianItems, pickBarId], (graphicalItems, id) => graphicalItems.filter(item => item.type === 'bar').find(item => item.id === id));
export var selectMaxBarSize = createSelector([selectSynchronisedBarSettings], barSettings => barSettings === null || barSettings === void 0 ? void 0 : barSettings.maxBarSize);
var pickCells = (_state, _xAxisId, _yAxisId, _isPanorama, _id, cells) => cells;
var getBarSize = (globalSize, totalSize, selfSize) => {
  var barSize = selfSize !== null && selfSize !== void 0 ? selfSize : globalSize;
  if (isNullish(barSize)) {
    return undefined;
  }
  return getPercentValue(barSize, totalSize, 0);
};
export var selectAllVisibleBars = createSelector([selectChartLayout, selectUnfilteredCartesianItems, pickXAxisId, pickYAxisId, pickIsPanorama], (layout, allItems, xAxisId, yAxisId, isPanorama) => allItems.filter(i => {
  if (layout === 'horizontal') {
    return i.xAxisId === xAxisId;
  }
  return i.yAxisId === yAxisId;
}).filter(i => i.isPanorama === isPanorama).filter(i => i.hide === false).filter(i => i.type === 'bar'));
var selectBarStackGroups = (state, xAxisId, yAxisId, isPanorama) => {
  var layout = selectChartLayout(state);
  if (layout === 'horizontal') {
    return selectStackGroups(state, 'yAxis', yAxisId, isPanorama);
  }
  return selectStackGroups(state, 'xAxis', xAxisId, isPanorama);
};
export var selectBarCartesianAxisSize = (state, xAxisId, yAxisId) => {
  var layout = selectChartLayout(state);
  if (layout === 'horizontal') {
    return selectCartesianAxisSize(state, 'xAxis', xAxisId);
  }
  return selectCartesianAxisSize(state, 'yAxis', yAxisId);
};
export var combineBarSizeList = (allBars, globalSize, totalSize) => {
  var initialValue = {};
  var stackedBars = allBars.filter(isStacked);
  var unstackedBars = allBars.filter(b => b.stackId == null);
  var groupByStack = stackedBars.reduce((acc, bar) => {
    if (!acc[bar.stackId]) {
      acc[bar.stackId] = [];
    }
    acc[bar.stackId].push(bar);
    return acc;
  }, initialValue);
  var stackedSizeList = Object.entries(groupByStack).map(_ref => {
    var [stackId, bars] = _ref;
    var dataKeys = bars.map(b => b.dataKey);
    var barSize = getBarSize(globalSize, totalSize, bars[0].barSize);
    return {
      stackId,
      dataKeys,
      barSize
    };
  });
  var unstackedSizeList = unstackedBars.map(b => {
    var dataKeys = [b.dataKey].filter(dk => dk != null);
    var barSize = getBarSize(globalSize, totalSize, b.barSize);
    return {
      stackId: undefined,
      dataKeys,
      barSize
    };
  });
  return [...stackedSizeList, ...unstackedSizeList];
};
export var selectBarSizeList = createSelector([selectAllVisibleBars, selectRootBarSize, selectBarCartesianAxisSize], combineBarSizeList);
export var selectBarBandSize = (state, xAxisId, yAxisId, isPanorama, id) => {
  var _ref2, _getBandSizeOfAxis;
  var barSettings = selectSynchronisedBarSettings(state, xAxisId, yAxisId, isPanorama, id);
  if (barSettings == null) {
    return undefined;
  }
  var layout = selectChartLayout(state);
  var globalMaxBarSize = selectRootMaxBarSize(state);
  var {
    maxBarSize: childMaxBarSize
  } = barSettings;
  var maxBarSize = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
  var axis, ticks;
  if (layout === 'horizontal') {
    axis = selectAxisWithScale(state, 'xAxis', xAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, 'xAxis', xAxisId, isPanorama);
  } else {
    axis = selectAxisWithScale(state, 'yAxis', yAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, 'yAxis', yAxisId, isPanorama);
  }
  return (_ref2 = (_getBandSizeOfAxis = getBandSizeOfAxis(axis, ticks, true)) !== null && _getBandSizeOfAxis !== void 0 ? _getBandSizeOfAxis : maxBarSize) !== null && _ref2 !== void 0 ? _ref2 : 0;
};
export var selectAxisBandSize = (state, xAxisId, yAxisId, isPanorama) => {
  var layout = selectChartLayout(state);
  var axis, ticks;
  if (layout === 'horizontal') {
    axis = selectAxisWithScale(state, 'xAxis', xAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, 'xAxis', xAxisId, isPanorama);
  } else {
    axis = selectAxisWithScale(state, 'yAxis', yAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, 'yAxis', yAxisId, isPanorama);
  }
  return getBandSizeOfAxis(axis, ticks);
};
function getBarPositions(barGap, barCategoryGap, bandSize, sizeList, maxBarSize) {
  var len = sizeList.length;
  if (len < 1) {
    return undefined;
  }
  var realBarGap = getPercentValue(barGap, bandSize, 0, true);
  var result;
  var initialValue = [];

  // whether is barSize set by user
  // Okay but why does it check only for the first element? What if the first element is set but others are not?
  if (isWellBehavedNumber(sizeList[0].barSize)) {
    var useFull = false;
    var fullBarSize = bandSize / len;
    var sum = sizeList.reduce((res, entry) => res + (entry.barSize || 0), 0);
    sum += (len - 1) * realBarGap;
    if (sum >= bandSize) {
      sum -= (len - 1) * realBarGap;
      realBarGap = 0;
    }
    if (sum >= bandSize && fullBarSize > 0) {
      useFull = true;
      fullBarSize *= 0.9;
      sum = len * fullBarSize;
    }
    var offset = (bandSize - sum) / 2 >> 0;
    var prev = {
      offset: offset - realBarGap,
      size: 0
    };
    result = sizeList.reduce((res, entry) => {
      var _entry$barSize;
      var newPosition = {
        stackId: entry.stackId,
        dataKeys: entry.dataKeys,
        position: {
          offset: prev.offset + prev.size + realBarGap,
          size: useFull ? fullBarSize : (_entry$barSize = entry.barSize) !== null && _entry$barSize !== void 0 ? _entry$barSize : 0
        }
      };
      var newRes = [...res, newPosition];
      prev = newRes[newRes.length - 1].position;
      return newRes;
    }, initialValue);
  } else {
    var _offset = getPercentValue(barCategoryGap, bandSize, 0, true);
    if (bandSize - 2 * _offset - (len - 1) * realBarGap <= 0) {
      realBarGap = 0;
    }
    var originalSize = (bandSize - 2 * _offset - (len - 1) * realBarGap) / len;
    if (originalSize > 1) {
      originalSize >>= 0;
    }
    var size = isWellBehavedNumber(maxBarSize) ? Math.min(originalSize, maxBarSize) : originalSize;
    result = sizeList.reduce((res, entry, i) => [...res, {
      stackId: entry.stackId,
      dataKeys: entry.dataKeys,
      position: {
        offset: _offset + (originalSize + realBarGap) * i + (originalSize - size) / 2,
        size
      }
    }], initialValue);
  }
  return result;
}
export var combineAllBarPositions = (sizeList, globalMaxBarSize, barGap, barCategoryGap, barBandSize, bandSize, childMaxBarSize) => {
  var maxBarSize = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
  var allBarPositions = getBarPositions(barGap, barCategoryGap, barBandSize !== bandSize ? barBandSize : bandSize, sizeList, maxBarSize);
  if (barBandSize !== bandSize && allBarPositions != null) {
    allBarPositions = allBarPositions.map(pos => _objectSpread(_objectSpread({}, pos), {}, {
      position: _objectSpread(_objectSpread({}, pos.position), {}, {
        offset: pos.position.offset - barBandSize / 2
      })
    }));
  }
  return allBarPositions;
};
export var selectAllBarPositions = createSelector([selectBarSizeList, selectRootMaxBarSize, selectBarGap, selectBarCategoryGap, selectBarBandSize, selectAxisBandSize, selectMaxBarSize], combineAllBarPositions);
var selectXAxisWithScale = (state, xAxisId, _yAxisId, isPanorama) => selectAxisWithScale(state, 'xAxis', xAxisId, isPanorama);
var selectYAxisWithScale = (state, _xAxisId, yAxisId, isPanorama) => selectAxisWithScale(state, 'yAxis', yAxisId, isPanorama);
var selectXAxisTicks = (state, xAxisId, _yAxisId, isPanorama) => selectTicksOfGraphicalItem(state, 'xAxis', xAxisId, isPanorama);
var selectYAxisTicks = (state, _xAxisId, yAxisId, isPanorama) => selectTicksOfGraphicalItem(state, 'yAxis', yAxisId, isPanorama);
export var selectBarPosition = createSelector([selectAllBarPositions, selectSynchronisedBarSettings], (allBarPositions, barSettings) => {
  if (allBarPositions == null || barSettings == null) {
    return undefined;
  }
  var position = allBarPositions.find(p => p.stackId === barSettings.stackId && barSettings.dataKey != null && p.dataKeys.includes(barSettings.dataKey));
  if (position == null) {
    return undefined;
  }
  return position.position;
});
export var combineStackedData = (stackGroups, barSettings) => {
  var stackSeriesIdentifier = getStackSeriesIdentifier(barSettings);
  if (!stackGroups || stackSeriesIdentifier == null || barSettings == null) {
    return undefined;
  }
  var {
    stackId
  } = barSettings;
  if (stackId == null) {
    return undefined;
  }
  var stackGroup = stackGroups[stackId];
  if (!stackGroup) {
    return undefined;
  }
  var {
    stackedData
  } = stackGroup;
  if (!stackedData) {
    return undefined;
  }
  return stackedData.find(sd => sd.key === stackSeriesIdentifier);
};
var selectStackedDataOfItem = createSelector([selectBarStackGroups, selectSynchronisedBarSettings], combineStackedData);
export var selectBarRectangles = createSelector([selectChartOffsetInternal, selectAxisViewBox, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks, selectBarPosition, selectChartLayout, selectChartDataWithIndexesIfNotInPanorama, selectAxisBandSize, selectStackedDataOfItem, selectSynchronisedBarSettings, pickCells], (offset, axisViewBox, xAxis, yAxis, xAxisTicks, yAxisTicks, pos, layout, _ref3, bandSize, stackedData, barSettings, cells) => {
  var {
    chartData,
    dataStartIndex,
    dataEndIndex
  } = _ref3;
  if (barSettings == null || pos == null || axisViewBox == null || layout !== 'horizontal' && layout !== 'vertical' || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || bandSize == null) {
    return undefined;
  }
  var {
    data
  } = barSettings;
  var displayedData;
  if (data != null && data.length > 0) {
    displayedData = data;
  } else {
    displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
  }
  if (displayedData == null) {
    return undefined;
  }
  return computeBarRectangles({
    layout,
    barSettings,
    pos,
    parentViewBox: axisViewBox,
    bandSize,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    stackedData,
    displayedData,
    offset,
    cells,
    dataStartIndex
  });
});