var _excluded = ["dangerouslySetInnerHTML", "ticks"],
  _excluded2 = ["id"],
  _excluded3 = ["domain"],
  _excluded4 = ["domain"];
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
import * as React from 'react';
import { isValidElement, useLayoutEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { CartesianAxis } from './CartesianAxis';
import { addYAxis, removeYAxis, updateYAxisWidth } from '../state/cartesianAxisSlice';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { implicitYAxis, selectAxisScale, selectTicksOfAxis, selectYAxisPosition, selectYAxisSettingsNoDefaults, selectYAxisSize } from '../state/selectors/axisSelectors';
import { selectAxisViewBox } from '../state/selectors/selectChartOffsetInternal';
import { useIsPanorama } from '../context/PanoramaContext';
import { isLabelContentAFunction } from '../component/Label';
import { shallowEqual } from '../util/ShallowEqual';
import { resolveDefaultProps } from '../util/resolveDefaultProps';
function SetYAxisSettings(settings) {
  var dispatch = useAppDispatch();
  useLayoutEffect(() => {
    dispatch(addYAxis(settings));
    return () => {
      dispatch(removeYAxis(settings));
    };
  }, [settings, dispatch]);
  return null;
}
var YAxisImpl = props => {
  var {
    yAxisId,
    className,
    width,
    label
  } = props;
  var cartesianAxisRef = useRef(null);
  var labelRef = useRef(null);
  var viewBox = useAppSelector(selectAxisViewBox);
  var isPanorama = useIsPanorama();
  var dispatch = useAppDispatch();
  var axisType = 'yAxis';
  var scale = useAppSelector(state => selectAxisScale(state, axisType, yAxisId, isPanorama));
  var axisSize = useAppSelector(state => selectYAxisSize(state, yAxisId));
  var position = useAppSelector(state => selectYAxisPosition(state, yAxisId));
  var cartesianTickItems = useAppSelector(state => selectTicksOfAxis(state, axisType, yAxisId, isPanorama));
  /*
   * Here we select settings from the store and prefer to use them instead of the actual props
   * so that the chart is consistent. If we used the props directly, some components will use axis settings
   * from state and some from props and because there is a render step between these two, they might be showing different things.
   * https://github.com/recharts/recharts/issues/6257
   */
  var synchronizedSettings = useAppSelector(state => selectYAxisSettingsNoDefaults(state, yAxisId));
  useLayoutEffect(() => {
    // No dynamic width calculation is done when width !== 'auto'
    // or when a function/react element is used for label
    if (width !== 'auto' || !axisSize || isLabelContentAFunction(label) || /*#__PURE__*/isValidElement(label) || synchronizedSettings == null) {
      return;
    }
    var axisComponent = cartesianAxisRef.current;
    if (!axisComponent) {
      return;
    }
    var updatedYAxisWidth = axisComponent.getCalculatedWidth();

    // if the width has changed, dispatch an action to update the width
    if (Math.round(axisSize.width) !== Math.round(updatedYAxisWidth)) {
      dispatch(updateYAxisWidth({
        id: yAxisId,
        width: updatedYAxisWidth
      }));
    }
  }, [
  // The dependency on cartesianAxisRef.current is not needed because useLayoutEffect will run after every render.
  // The ref will be populated by then.
  // To re-run this effect when ticks change, we can depend on the ticks array from the store.
  cartesianTickItems, axisSize, dispatch, label, yAxisId, width, synchronizedSettings]);
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
    ref: cartesianAxisRef,
    labelRef: labelRef,
    scale: scale,
    x: position.x,
    y: position.y,
    tickTextProps: width === 'auto' ? {
      width: undefined
    } : {
      width
    },
    width: axisSize.width,
    height: axisSize.height,
    className: clsx("recharts-".concat(axisType, " ").concat(axisType), className),
    viewBox: viewBox,
    ticks: cartesianTickItems,
    axisType: axisType
  }));
};
export var yAxisDefaultProps = {
  allowDataOverflow: implicitYAxis.allowDataOverflow,
  allowDecimals: implicitYAxis.allowDecimals,
  allowDuplicatedCategory: implicitYAxis.allowDuplicatedCategory,
  hide: false,
  mirror: implicitYAxis.mirror,
  orientation: implicitYAxis.orientation,
  padding: implicitYAxis.padding,
  reversed: implicitYAxis.reversed,
  scale: implicitYAxis.scale,
  tickCount: implicitYAxis.tickCount,
  type: implicitYAxis.type,
  width: implicitYAxis.width,
  yAxisId: 0
};
var YAxisSettingsDispatcher = outsideProps => {
  var _props$interval, _props$includeHidden, _props$angle, _props$minTickGap, _props$tick;
  var props = resolveDefaultProps(outsideProps, yAxisDefaultProps);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SetYAxisSettings, {
    interval: (_props$interval = props.interval) !== null && _props$interval !== void 0 ? _props$interval : 'preserveEnd',
    id: props.yAxisId,
    scale: props.scale,
    type: props.type,
    domain: props.domain,
    allowDataOverflow: props.allowDataOverflow,
    dataKey: props.dataKey,
    allowDuplicatedCategory: props.allowDuplicatedCategory,
    allowDecimals: props.allowDecimals,
    tickCount: props.tickCount,
    padding: props.padding,
    includeHidden: (_props$includeHidden = props.includeHidden) !== null && _props$includeHidden !== void 0 ? _props$includeHidden : false,
    reversed: props.reversed,
    ticks: props.ticks,
    width: props.width,
    orientation: props.orientation,
    mirror: props.mirror,
    hide: props.hide,
    unit: props.unit,
    name: props.name,
    angle: (_props$angle = props.angle) !== null && _props$angle !== void 0 ? _props$angle : 0,
    minTickGap: (_props$minTickGap = props.minTickGap) !== null && _props$minTickGap !== void 0 ? _props$minTickGap : 5,
    tick: (_props$tick = props.tick) !== null && _props$tick !== void 0 ? _props$tick : true,
    tickFormatter: props.tickFormatter
  }), /*#__PURE__*/React.createElement(YAxisImpl, props));
};
var YAxisMemoComparator = (prevProps, nextProps) => {
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
export var YAxis = /*#__PURE__*/React.memo(YAxisSettingsDispatcher, YAxisMemoComparator);
YAxis.displayName = 'YAxis';