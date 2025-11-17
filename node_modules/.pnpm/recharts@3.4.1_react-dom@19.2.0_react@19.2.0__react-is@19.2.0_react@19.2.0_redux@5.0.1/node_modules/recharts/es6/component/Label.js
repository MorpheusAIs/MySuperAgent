var _excluded = ["labelRef"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from 'react';
import { cloneElement, createContext, createElement, isValidElement, useContext, useMemo } from 'react';
import { clsx } from 'clsx';
import { isValidTextAnchor, Text } from './Text';
import { getPercentValue, isNullish, isNumber, isNumOrStr, isPercent, mathSign, uniqueId } from '../util/DataUtils';
import { polarToCartesian } from '../util/PolarUtils';
import { cartesianViewBoxToTrapezoid, useViewBox } from '../context/chartLayoutContext';
import { useAppSelector } from '../state/hooks';
import { selectPolarViewBox } from '../state/selectors/polarAxisSelectors';
import { resolveDefaultProps } from '../util/resolveDefaultProps';
import { svgPropertiesAndEvents } from '../util/svgPropertiesAndEvents';
import { ZIndexLayer } from '../zIndex/ZIndexLayer';
import { DefaultZIndexes } from '../zIndex/DefaultZIndexes';
var CartesianLabelContext = /*#__PURE__*/createContext(null);
export var CartesianLabelContextProvider = _ref => {
  var {
    x,
    y,
    upperWidth,
    lowerWidth,
    width,
    height,
    children
  } = _ref;
  var viewBox = useMemo(() => ({
    x,
    y,
    upperWidth,
    lowerWidth,
    width,
    height
  }), [x, y, upperWidth, lowerWidth, width, height]);
  return /*#__PURE__*/React.createElement(CartesianLabelContext.Provider, {
    value: viewBox
  }, children);
};
var useCartesianLabelContext = () => {
  var labelChildContext = useContext(CartesianLabelContext);
  var chartContext = useViewBox();
  return labelChildContext || cartesianViewBoxToTrapezoid(chartContext);
};
var PolarLabelContext = /*#__PURE__*/createContext(null);
export var PolarLabelContextProvider = _ref2 => {
  var {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    clockWise,
    children
  } = _ref2;
  var viewBox = useMemo(() => ({
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    clockWise
  }), [cx, cy, innerRadius, outerRadius, startAngle, endAngle, clockWise]);
  return /*#__PURE__*/React.createElement(PolarLabelContext.Provider, {
    value: viewBox
  }, children);
};
export var usePolarLabelContext = () => {
  var labelChildContext = useContext(PolarLabelContext);
  var chartContext = useAppSelector(selectPolarViewBox);
  return labelChildContext || chartContext;
};
var getLabel = props => {
  var {
    value,
    formatter
  } = props;
  var label = isNullish(props.children) ? value : props.children;
  if (typeof formatter === 'function') {
    return formatter(label);
  }
  return label;
};
export var isLabelContentAFunction = content => {
  return content != null && typeof content === 'function';
};
var getDeltaAngle = (startAngle, endAngle) => {
  var sign = mathSign(endAngle - startAngle);
  var deltaAngle = Math.min(Math.abs(endAngle - startAngle), 360);
  return sign * deltaAngle;
};
var renderRadialLabel = (labelProps, position, label, attrs, viewBox) => {
  var {
    offset,
    className
  } = labelProps;
  var {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    clockWise
  } = viewBox;
  var radius = (innerRadius + outerRadius) / 2;
  var deltaAngle = getDeltaAngle(startAngle, endAngle);
  var sign = deltaAngle >= 0 ? 1 : -1;
  var labelAngle, direction;
  switch (position) {
    case 'insideStart':
      labelAngle = startAngle + sign * offset;
      direction = clockWise;
      break;
    case 'insideEnd':
      labelAngle = endAngle - sign * offset;
      direction = !clockWise;
      break;
    case 'end':
      labelAngle = endAngle + sign * offset;
      direction = clockWise;
      break;
    default:
      throw new Error("Unsupported position ".concat(position));
  }
  direction = deltaAngle <= 0 ? direction : !direction;
  var startPoint = polarToCartesian(cx, cy, radius, labelAngle);
  var endPoint = polarToCartesian(cx, cy, radius, labelAngle + (direction ? 1 : -1) * 359);
  var path = "M".concat(startPoint.x, ",").concat(startPoint.y, "\n    A").concat(radius, ",").concat(radius, ",0,1,").concat(direction ? 0 : 1, ",\n    ").concat(endPoint.x, ",").concat(endPoint.y);
  var id = isNullish(labelProps.id) ? uniqueId('recharts-radial-line-') : labelProps.id;
  return /*#__PURE__*/React.createElement("text", _extends({}, attrs, {
    dominantBaseline: "central",
    className: clsx('recharts-radial-bar-label', className)
  }), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("path", {
    id: id,
    d: path
  })), /*#__PURE__*/React.createElement("textPath", {
    xlinkHref: "#".concat(id)
  }, label));
};
var getAttrsOfPolarLabel = (viewBox, offset, position) => {
  var {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle
  } = viewBox;
  var midAngle = (startAngle + endAngle) / 2;
  if (position === 'outside') {
    var {
      x: _x,
      y: _y
    } = polarToCartesian(cx, cy, outerRadius + offset, midAngle);
    return {
      x: _x,
      y: _y,
      textAnchor: _x >= cx ? 'start' : 'end',
      verticalAnchor: 'middle'
    };
  }
  if (position === 'center') {
    return {
      x: cx,
      y: cy,
      textAnchor: 'middle',
      verticalAnchor: 'middle'
    };
  }
  if (position === 'centerTop') {
    return {
      x: cx,
      y: cy,
      textAnchor: 'middle',
      verticalAnchor: 'start'
    };
  }
  if (position === 'centerBottom') {
    return {
      x: cx,
      y: cy,
      textAnchor: 'middle',
      verticalAnchor: 'end'
    };
  }
  var r = (innerRadius + outerRadius) / 2;
  var {
    x,
    y
  } = polarToCartesian(cx, cy, r, midAngle);
  return {
    x,
    y,
    textAnchor: 'middle',
    verticalAnchor: 'middle'
  };
};
var isPolar = viewBox => 'cx' in viewBox && isNumber(viewBox.cx);
export var getAttrsOfCartesianLabel = (props, viewBox) => {
  var {
    parentViewBox: parentViewBoxFromProps,
    offset,
    position
  } = props;
  var parentViewBox;
  if (parentViewBoxFromProps != null && !isPolar(parentViewBoxFromProps)) {
    // Check that nobody is trying to pass a polar viewBox to a cartesian label
    parentViewBox = parentViewBoxFromProps;
  }
  var {
    x,
    y,
    upperWidth,
    lowerWidth,
    height
  } = viewBox;

  // Funnel.tsx provides a viewBox where `x` is the top-left of the trapezoid shape.
  var upperX = x;
  // The trapezoid is centered, so we can calculate the other corners from the top-left.
  var lowerX = x + (upperWidth - lowerWidth) / 2;
  // middleX is the x-coordinate of the left edge at the vertical midpoint of the trapezoid.
  var middleX = (upperX + lowerX) / 2;
  // The width of the trapezoid at its vertical midpoint.
  var midHeightWidth = (upperWidth + lowerWidth) / 2;
  // The center x-coordinate is constant for the entire height of the trapezoid.
  var centerX = upperX + upperWidth / 2;

  // Define vertical offsets and position inverts based on the value being positive or negative.
  // This allows labels to be positioned correctly for bars with negative height.
  var verticalSign = height >= 0 ? 1 : -1;
  var verticalOffset = verticalSign * offset;
  var verticalEnd = verticalSign > 0 ? 'end' : 'start';
  var verticalStart = verticalSign > 0 ? 'start' : 'end';

  // Define horizontal offsets and position inverts based on the value being positive or negative.
  // This allows labels to be positioned correctly for bars with negative width.
  var horizontalSign = upperWidth >= 0 ? 1 : -1;
  var horizontalOffset = horizontalSign * offset;
  var horizontalEnd = horizontalSign > 0 ? 'end' : 'start';
  var horizontalStart = horizontalSign > 0 ? 'start' : 'end';
  if (position === 'top') {
    var attrs = {
      x: upperX + upperWidth / 2,
      y: y - verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalEnd
    };
    return _objectSpread(_objectSpread({}, attrs), parentViewBox ? {
      height: Math.max(y - parentViewBox.y, 0),
      width: upperWidth
    } : {});
  }
  if (position === 'bottom') {
    var _attrs = {
      x: lowerX + lowerWidth / 2,
      y: y + height + verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalStart
    };
    return _objectSpread(_objectSpread({}, _attrs), parentViewBox ? {
      height: Math.max(parentViewBox.y + parentViewBox.height - (y + height), 0),
      width: lowerWidth
    } : {});
  }
  if (position === 'left') {
    var _attrs2 = {
      x: middleX - horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalEnd,
      verticalAnchor: 'middle'
    };
    return _objectSpread(_objectSpread({}, _attrs2), parentViewBox ? {
      width: Math.max(_attrs2.x - parentViewBox.x, 0),
      height
    } : {});
  }
  if (position === 'right') {
    var _attrs3 = {
      x: middleX + midHeightWidth + horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalStart,
      verticalAnchor: 'middle'
    };
    return _objectSpread(_objectSpread({}, _attrs3), parentViewBox ? {
      width: Math.max(parentViewBox.x + parentViewBox.width - _attrs3.x, 0),
      height
    } : {});
  }
  var sizeAttrs = parentViewBox ? {
    width: midHeightWidth,
    height
  } : {};
  if (position === 'insideLeft') {
    return _objectSpread({
      x: middleX + horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalStart,
      verticalAnchor: 'middle'
    }, sizeAttrs);
  }
  if (position === 'insideRight') {
    return _objectSpread({
      x: middleX + midHeightWidth - horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalEnd,
      verticalAnchor: 'middle'
    }, sizeAttrs);
  }
  if (position === 'insideTop') {
    return _objectSpread({
      x: upperX + upperWidth / 2,
      y: y + verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalStart
    }, sizeAttrs);
  }
  if (position === 'insideBottom') {
    return _objectSpread({
      x: lowerX + lowerWidth / 2,
      y: y + height - verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalEnd
    }, sizeAttrs);
  }
  if (position === 'insideTopLeft') {
    return _objectSpread({
      x: upperX + horizontalOffset,
      y: y + verticalOffset,
      textAnchor: horizontalStart,
      verticalAnchor: verticalStart
    }, sizeAttrs);
  }
  if (position === 'insideTopRight') {
    return _objectSpread({
      x: upperX + upperWidth - horizontalOffset,
      y: y + verticalOffset,
      textAnchor: horizontalEnd,
      verticalAnchor: verticalStart
    }, sizeAttrs);
  }
  if (position === 'insideBottomLeft') {
    return _objectSpread({
      x: lowerX + horizontalOffset,
      y: y + height - verticalOffset,
      textAnchor: horizontalStart,
      verticalAnchor: verticalEnd
    }, sizeAttrs);
  }
  if (position === 'insideBottomRight') {
    return _objectSpread({
      x: lowerX + lowerWidth - horizontalOffset,
      y: y + height - verticalOffset,
      textAnchor: horizontalEnd,
      verticalAnchor: verticalEnd
    }, sizeAttrs);
  }
  if (!!position && typeof position === 'object' && (isNumber(position.x) || isPercent(position.x)) && (isNumber(position.y) || isPercent(position.y))) {
    // TODO: This is not quite right. The width of the trapezoid changes with y.
    // A percentage-based x should be relative to the width at that y.
    // For now, we use the mid-height width as a reasonable approximation.
    return _objectSpread({
      x: x + getPercentValue(position.x, midHeightWidth),
      y: y + getPercentValue(position.y, height),
      textAnchor: 'end',
      verticalAnchor: 'end'
    }, sizeAttrs);
  }
  return _objectSpread({
    x: centerX,
    y: y + height / 2,
    textAnchor: 'middle',
    verticalAnchor: 'middle'
  }, sizeAttrs);
};
var defaultLabelProps = {
  offset: 5,
  zIndex: DefaultZIndexes.label
};
export function Label(outerProps) {
  var props = resolveDefaultProps(outerProps, defaultLabelProps);
  var {
    viewBox: viewBoxFromProps,
    position,
    value,
    children,
    content,
    className = '',
    textBreakAll,
    labelRef
  } = props;
  var polarViewBox = usePolarLabelContext();
  var cartesianViewBox = useCartesianLabelContext();

  /*
   * I am not proud about this solution, but it's a quick fix for https://github.com/recharts/recharts/issues/6030#issuecomment-3155352460.
   * What we should really do is split Label into two components: CartesianLabel and PolarLabel and then handle their respective viewBoxes separately.
   * Also other components should set its own viewBox in a context so that we can fix https://github.com/recharts/recharts/issues/6156
   */
  var resolvedViewBox = position === 'center' ? cartesianViewBox : polarViewBox !== null && polarViewBox !== void 0 ? polarViewBox : cartesianViewBox;
  var viewBox, label, positionAttrs;
  if (viewBoxFromProps == null) {
    viewBox = resolvedViewBox;
  } else if (isPolar(viewBoxFromProps)) {
    viewBox = viewBoxFromProps;
  } else {
    viewBox = cartesianViewBoxToTrapezoid(viewBoxFromProps);
  }
  if (!viewBox || isNullish(value) && isNullish(children) && ! /*#__PURE__*/isValidElement(content) && typeof content !== 'function') {
    return null;
  }
  var propsWithViewBox = _objectSpread(_objectSpread({}, props), {}, {
    viewBox
  });
  if (/*#__PURE__*/isValidElement(content)) {
    var {
        labelRef: _
      } = propsWithViewBox,
      propsWithoutLabelRef = _objectWithoutProperties(propsWithViewBox, _excluded);
    return /*#__PURE__*/cloneElement(content, propsWithoutLabelRef);
  }
  if (typeof content === 'function') {
    // @ts-expect-error we're not checking if the content component returns something that Text is able to render
    label = /*#__PURE__*/createElement(content, propsWithViewBox);
    if (/*#__PURE__*/isValidElement(label)) {
      return label;
    }
  } else {
    label = getLabel(props);
  }
  var attrs = svgPropertiesAndEvents(props);
  if (isPolar(viewBox)) {
    if (position === 'insideStart' || position === 'insideEnd' || position === 'end') {
      return renderRadialLabel(props, position, label, attrs, viewBox);
    }
    positionAttrs = getAttrsOfPolarLabel(viewBox, props.offset, props.position);
  } else {
    positionAttrs = getAttrsOfCartesianLabel(props, viewBox);
  }
  return /*#__PURE__*/React.createElement(ZIndexLayer, {
    zIndex: props.zIndex
  }, /*#__PURE__*/React.createElement(Text, _extends({
    ref: labelRef,
    className: clsx('recharts-label', className)
  }, attrs, positionAttrs, {
    /*
     * textAnchor is decided by default based on the `position`
     * but we allow overriding via props for precise control.
     */
    textAnchor: isValidTextAnchor(attrs.textAnchor) ? attrs.textAnchor : positionAttrs.textAnchor,
    breakAll: textBreakAll
  }), label));
}
Label.displayName = 'Label';
var parseLabel = (label, viewBox, labelRef) => {
  if (!label) {
    return null;
  }
  var commonProps = {
    viewBox,
    labelRef
  };
  if (label === true) {
    return /*#__PURE__*/React.createElement(Label, _extends({
      key: "label-implicit"
    }, commonProps));
  }
  if (isNumOrStr(label)) {
    return /*#__PURE__*/React.createElement(Label, _extends({
      key: "label-implicit",
      value: label
    }, commonProps));
  }
  if (/*#__PURE__*/isValidElement(label)) {
    if (label.type === Label) {
      return /*#__PURE__*/cloneElement(label, _objectSpread({
        key: 'label-implicit'
      }, commonProps));
    }
    return /*#__PURE__*/React.createElement(Label, _extends({
      key: "label-implicit",
      content: label
    }, commonProps));
  }
  if (isLabelContentAFunction(label)) {
    return /*#__PURE__*/React.createElement(Label, _extends({
      key: "label-implicit",
      content: label
    }, commonProps));
  }
  if (label && typeof label === 'object') {
    return /*#__PURE__*/React.createElement(Label, _extends({}, label, {
      key: "label-implicit"
    }, commonProps));
  }
  return null;
};
export function CartesianLabelFromLabelProp(_ref3) {
  var {
    label,
    labelRef
  } = _ref3;
  var viewBox = useCartesianLabelContext();
  return parseLabel(label, viewBox, labelRef) || null;
}
export function PolarLabelFromLabelProp(_ref4) {
  var {
    label
  } = _ref4;
  var viewBox = usePolarLabelContext();
  return parseLabel(label, viewBox) || null;
}