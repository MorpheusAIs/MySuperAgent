"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AllZIndexPortals = AllZIndexPortals;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _hooks = require("../state/hooks");
var _zIndexSlice = require("../state/zIndexSlice");
var _useUniqueId = require("../util/useUniqueId");
var _zIndexSelectors = require("./zIndexSelectors");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function ZIndexSvgPortal(_ref) {
  var {
    zIndex,
    isPanorama
  } = _ref;
  var prefix = isPanorama ? "recharts-zindex-panorama-" : "recharts-zindex-";
  var portalId = (0, _useUniqueId.useUniqueId)("".concat(prefix).concat(zIndex));
  var dispatch = (0, _hooks.useAppDispatch)();
  (0, _react.useLayoutEffect)(() => {
    dispatch((0, _zIndexSlice.registerZIndexPortalId)({
      zIndex,
      elementId: portalId,
      isPanorama
    }));
    return () => {
      dispatch((0, _zIndexSlice.unregisterZIndexPortalId)({
        zIndex,
        isPanorama
      }));
    };
  }, [dispatch, zIndex, portalId, isPanorama]);
  return /*#__PURE__*/React.createElement("g", {
    id: portalId
  });
}
function AllZIndexPortals(_ref2) {
  var {
    children,
    isPanorama
  } = _ref2;
  var allRegisteredZIndexes = (0, _hooks.useAppSelector)(_zIndexSelectors.selectAllRegisteredZIndexes);
  if (!allRegisteredZIndexes || allRegisteredZIndexes.length === 0) {
    return children;
  }
  var allNegativeZIndexes = allRegisteredZIndexes.filter(zIndex => zIndex < 0);
  // We exclude zero on purpose - that is the default layer, and it doesn't need a portal.
  var allPositiveZIndexes = allRegisteredZIndexes.filter(zIndex => zIndex > 0);
  return /*#__PURE__*/React.createElement(React.Fragment, null, allNegativeZIndexes.map(zIndex => /*#__PURE__*/React.createElement(ZIndexSvgPortal, {
    key: zIndex,
    zIndex: zIndex,
    isPanorama: isPanorama
  })), children, allPositiveZIndexes.map(zIndex => /*#__PURE__*/React.createElement(ZIndexSvgPortal, {
    key: zIndex,
    zIndex: zIndex,
    isPanorama: isPanorama
  })));
}