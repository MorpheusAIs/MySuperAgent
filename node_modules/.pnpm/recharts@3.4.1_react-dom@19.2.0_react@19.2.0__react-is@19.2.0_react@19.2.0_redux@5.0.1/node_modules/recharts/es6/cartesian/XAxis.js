var _excluded = ["dangerouslySetInnerHTML", "ticks"],
  _excluded2 = ["id"],
  _excluded3 = ["domain"],
  _excluded4 = ["domain"];
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
/**
 * @fileOverview X Axis
 */
import * as React from 'react';
import { useLayoutEffect } from 'react';
import { clsx } from 'clsx';
import { CartesianAxis } from './CartesianAxis';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { addXAxis, removeXAxis } from '../state/cartesianAxisSlice';
import { implicitXAxis, selectAxisScale, selectTicksOfAxis, selectXAxisPosition, selectXAxisSettingsNoDefaults, selectXAxisSize } from '../state/selectors/axisSelectors';
import { selectAxisViewBox } from '../state/selectors/selectChartOffsetInternal';
import { useIsPanorama } from '../context/PanoramaContext';
import { shallowEqual } from '../util/ShallowEqual';
import { resolveDefaultProps } from '../util/resolveDefaultProps';
function SetXAxisSettings(settings) {
  var dispatch = useAppDispatch();
  useLayoutEffect(() => {
    dispatch(addXAxis(settings));
    return () => {
      dispatch(removeXAxis(settings));
    };
  }, [settings, dispatch]);
  return null;
}
var XAxisImpl = props => {
  var {
    xAxisId,
    className
  } = props;
  var viewBox = useAppSelector(selectAxisViewBox);
  var isPanorama = useIsPanorama();
  var axisType = 'xAxis';
  var scale = useAppSelector(state => selectAxisScale(state, axisType, xAxisId, isPanorama));
  var cartesianTickItems = useAppSelector(state => selectTicksOfAxis(state, axisType, xAxisId, isPanorama));
  var axisSize = useAppSelector(state => selectXAxisSize(state, xAxisId));
  var position = useAppSelector(state => selectXAxisPosition(state, xAxisId));
  /*
   * Here we select settings from the store and prefer to use them instead of the actual props
   * so that the chart is consistent. If we used the props directly, some components will use axis settings
   * from state and some from props and because there is a render step between these two, they might be showing different things.
   * https://github.com/recharts/recharts/issues/6257
   */
  var synchronizedSettings = useAppSelector(state => selectXAxisSettingsNoDefaults(state, xAxisId));
  if (axisSize == null || position == null || synchronizedSettings == null) {
    return null;
  }
  var {
      dangerouslySetInnerHTML,
      ticks
    } = props,
    allOtherProps = _objectWithoutProperties(props, _excluded);
  var {
      id
    } = synchronizedSettings,
    restSynchronizedSettings = _objectWithoutProperties(synchronizedSettings, _excluded2);
  return /*#__PURE__*/React.createElement(CartesianAxis, _extends({}, allOtherProps, restSynchronizedSettings, {
    scale: scale,
    x: position.x,
    y: position.y,
    width: axisSize.width,
    height: axisSize.height,
    className: clsx("recharts-".concat(axisType, " ").concat(axisType), className),
    viewBox: viewBox,
    ticks: cartesianTickItems,
    axisType: axisType
  }));
};
var xAxisDefaultProps = {
  allowDataOverflow: implicitXAxis.allowDataOverflow,
  allowDecimals: implicitXAxis.allowDecimals,
  allowDuplicatedCategory: implicitXAxis.allowDuplicatedCategory,
  height: implicitXAxis.height,
  hide: false,
  mirror: implicitXAxis.mirror,
  orientation: implicitXAxis.orientation,
  padding: implicitXAxis.padding,
  reversed: implicitXAxis.reversed,
  scale: implicitXAxis.scale,
  tickCount: implicitXAxis.tickCount,
  type: implicitXAxis.type,
  xAxisId: 0
};
var XAxisSettingsDispatcher = outsideProps => {
  var _props$interval, _props$includeHidden, _props$angle, _props$minTickGap, _props$tick;
  var props = resolveDefaultProps(outsideProps, xAxisDefaultProps);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SetXAxisSettings, {
    interval: (_props$interval = props.interval) !== null && _props$interval !== void 0 ? _props$interval : 'preserveEnd',
    id: props.xAxisId,
    scale: props.scale,
    type: props.type,
    padding: props.padding,
    allowDataOverflow: props.allowDataOverflow,
    domain: props.domain,
    dataKey: props.dataKey,
    allowDuplicatedCategory: props.allowDuplicatedCategory,
    allowDecimals: props.allowDecimals,
    tickCount: props.tickCount,
    includeHidden: (_props$includeHidden = props.includeHidden) !== null && _props$includeHidden !== void 0 ? _props$includeHidden : false,
    reversed: props.reversed,
    ticks: props.ticks,
    height: props.height,
    orientation: props.orientation,
    mirror: props.mirror,
    hide: props.hide,
    unit: props.unit,
    name: props.name,
    angle: (_props$angle = props.angle) !== null && _props$angle !== void 0 ? _props$angle : 0,
    minTickGap: (_props$minTickGap = props.minTickGap) !== null && _props$minTickGap !== void 0 ? _props$minTickGap : 5,
    tick: (_props$tick = props.tick) !== null && _props$tick !== void 0 ? _props$tick : true,
    tickFormatter: props.tickFormatter
  }), /*#__PURE__*/React.createElement(XAxisImpl, props));
};
var XAxisMemoComparator = (prevProps, nextProps) => {
  var {
      domain: prevDomain
    } = prevProps,
    prevRest = _objectWithoutProperties(prevProps, _excluded3);
  var {
      domain: nextDomain
    } = nextProps,
    nextRest = _objectWithoutProperties(nextProps, _excluded4);
  if (!shallowEqual(prevRest, nextRest)) {
    return false;
  }
  if (Array.isArray(prevDomain) && prevDomain.length === 2 && Array.isArray(nextDomain) && nextDomain.length === 2) {
    return prevDomain[0] === nextDomain[0] && prevDomain[1] === nextDomain[1];
  }
  return shallowEqual({
    domain: prevDomain
  }, {
    domain: nextDomain
  });
};
export var XAxis = /*#__PURE__*/React.memo(XAxisSettingsDispatcher, XAxisMemoComparator);
XAxis.displayName = 'XAxis';