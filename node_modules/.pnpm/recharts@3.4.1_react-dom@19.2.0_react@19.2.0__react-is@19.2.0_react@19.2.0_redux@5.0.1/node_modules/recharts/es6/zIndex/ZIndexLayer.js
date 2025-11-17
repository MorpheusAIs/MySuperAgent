import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { noop } from '../util/DataUtils';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { selectZIndexPortalId } from './zIndexSelectors';
import { registerZIndexPortal, unregisterZIndexPortal } from '../state/zIndexSlice';
import { useIsInChartContext } from '../context/chartLayoutContext';
import { useIsPanorama } from '../context/PanoramaContext';

/**
 * @since 3.4
 */

/**
 * A layer that renders its children into a portal corresponding to the given zIndex.
 * We can't use regular CSS z-index because SVG does not support it.
 * So instead, we create separate DOM nodes for each zIndex layer
 * and render the children into the corresponding DOM node using React portals.
 *
 * This component must be used inside a Chart component.
 *
 * @param zIndex numeric zIndex value, higher values are rendered on top of lower values
 * @param children the content to render inside this zIndex layer
 */
export function ZIndexLayer(_ref) {
  var {
    zIndex,
    children
  } = _ref;
  /*
   * If we are outside of chart, then we can't rely on the zIndex portal state,
   * so we just render normally.
   */
  var isInChartContext = useIsInChartContext();
  /*
   * If zIndex is undefined then we render normally without portals.
   * Also, if zIndex is 0, we render normally without portals,
   * because 0 is the default layer that does not need a portal.
   */
  var shouldRenderInPortal = isInChartContext && zIndex !== undefined && zIndex !== 0;
  var isPanorama = useIsPanorama();
  var dispatch = useAppDispatch();
  useLayoutEffect(() => {
    if (!shouldRenderInPortal) {
      // Nothing to do. We have to call the hook because of the rules of hooks.
      return noop;
    }
    /*
     * Because zIndexes are dynamic (meaning, we're not working with a predefined set of layers,
     * but we allow users to define any zIndex at any time), we need to register
     * the requested zIndex in the global store. This way, the ZIndexPortals component
     * can render the corresponding portals and only the requested ones.
     */
    dispatch(registerZIndexPortal({
      zIndex
    }));
    return () => {
      dispatch(unregisterZIndexPortal({
        zIndex
      }));
    };
  }, [dispatch, zIndex, shouldRenderInPortal]);
  var portalId = useAppSelector(state => selectZIndexPortalId(state, zIndex, isPanorama));
  if (!shouldRenderInPortal) {
    // If no zIndex is provided or zIndex is 0, render normally without portals
    return children;
  }
  if (!portalId) {
    /*
     * If we don't have a portalId yet, this means that the registration
     * has not been processed yet by the ZIndexPortals component.
     * So here we render null and wait for the next render cycle.
     */
    return null;
  }
  var zIndexPortal = document.getElementById(portalId);
  if (zIndexPortal) {
    return /*#__PURE__*/createPortal(children, zIndexPortal);
  }
  /*
   * If the portal is not found, this means it has not been rendered yet.
   * So here we render null and wait for the next render cycle.
   */
  return null;
}