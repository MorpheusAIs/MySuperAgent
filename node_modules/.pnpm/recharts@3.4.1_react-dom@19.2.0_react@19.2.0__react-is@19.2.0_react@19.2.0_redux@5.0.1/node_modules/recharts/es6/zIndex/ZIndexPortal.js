import * as React from 'react';
import { useLayoutEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { registerZIndexPortalId, unregisterZIndexPortalId } from '../state/zIndexSlice';
import { useUniqueId } from '../util/useUniqueId';
import { selectAllRegisteredZIndexes } from './zIndexSelectors';
function ZIndexSvgPortal(_ref) {
  var {
    zIndex,
    isPanorama
  } = _ref;
  var prefix = isPanorama ? "recharts-zindex-panorama-" : "recharts-zindex-";
  var portalId = useUniqueId("".concat(prefix).concat(zIndex));
  var dispatch = useAppDispatch();
  useLayoutEffect(() => {
    dispatch(registerZIndexPortalId({
      zIndex,
      elementId: portalId,
      isPanorama
    }));
    return () => {
      dispatch(unregisterZIndexPortalId({
        zIndex,
        isPanorama
      }));
    };
  }, [dispatch, zIndex, portalId, isPanorama]);
  return /*#__PURE__*/React.createElement("g", {
    id: portalId
  });
}
export function AllZIndexPortals(_ref2) {
  var {
    children,
    isPanorama
  } = _ref2;
  var allRegisteredZIndexes = useAppSelector(selectAllRegisteredZIndexes);
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