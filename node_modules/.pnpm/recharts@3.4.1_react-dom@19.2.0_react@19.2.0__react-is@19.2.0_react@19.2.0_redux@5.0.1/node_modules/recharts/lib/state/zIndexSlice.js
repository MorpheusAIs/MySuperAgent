"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.zIndexReducer = exports.unregisterZIndexPortalId = exports.unregisterZIndexPortal = exports.registerZIndexPortalId = exports.registerZIndexPortal = void 0;
var _toolkit = require("@reduxjs/toolkit");
var _DefaultZIndexes = require("../zIndex/DefaultZIndexes");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * This slice contains a registry of z-index values for various components.
 * The state is a map from z-index numbers to a string ID.
 */
var seed = {};
var initialState = {
  zIndexMap: Object.values(_DefaultZIndexes.DefaultZIndexes).reduce((acc, current) => _objectSpread(_objectSpread({}, acc), {}, {
    [current]: {
      elementId: undefined,
      panoramaElementId: undefined,
      consumers: 0
    }
  }), seed)
};
var defaultZIndexSet = new Set(Object.values(_DefaultZIndexes.DefaultZIndexes));
function isDefaultZIndex(zIndex) {
  return defaultZIndexSet.has(zIndex);
}
var zIndexSlice = (0, _toolkit.createSlice)({
  name: 'zIndex',
  initialState,
  reducers: {
    registerZIndexPortal: {
      reducer: (state, action) => {
        var {
          zIndex
        } = action.payload;
        if (state.zIndexMap[zIndex]) {
          state.zIndexMap[zIndex].consumers += 1;
        } else {
          state.zIndexMap[zIndex] = {
            consumers: 1,
            elementId: undefined,
            panoramaElementId: undefined
          };
        }
      },
      prepare: (0, _toolkit.prepareAutoBatched)()
    },
    unregisterZIndexPortal: {
      reducer: (state, action) => {
        var {
          zIndex
        } = action.payload;
        if (state.zIndexMap[zIndex]) {
          state.zIndexMap[zIndex].consumers -= 1;
          /*
           * Garbage collect unused z-index entries, except for default z-indexes.
           * Default z-indexes are always rendered, regardless of whether there are consumers or not.
           * And because of that, even if we delete this entry, the ZIndexPortal provider will still be rendered
           * and React is not going to re-create it, and it won't re-register the element ID.
           * So let's not delete default z-index entries.
           */
          if (state.zIndexMap[zIndex].consumers <= 0 && !isDefaultZIndex(zIndex)) {
            delete state.zIndexMap[zIndex];
          }
        }
      },
      prepare: (0, _toolkit.prepareAutoBatched)()
    },
    registerZIndexPortalId: {
      reducer: (state, action) => {
        var {
          zIndex,
          elementId,
          isPanorama
        } = action.payload;
        if (state.zIndexMap[zIndex]) {
          if (isPanorama) {
            state.zIndexMap[zIndex].panoramaElementId = elementId;
          } else {
            state.zIndexMap[zIndex].elementId = elementId;
          }
        } else {
          state.zIndexMap[zIndex] = {
            consumers: 0,
            elementId: isPanorama ? undefined : elementId,
            panoramaElementId: isPanorama ? elementId : undefined
          };
        }
      },
      prepare: (0, _toolkit.prepareAutoBatched)()
    },
    unregisterZIndexPortalId: {
      reducer: (state, action) => {
        var {
          zIndex
        } = action.payload;
        if (state.zIndexMap[zIndex]) {
          if (action.payload.isPanorama) {
            state.zIndexMap[zIndex].panoramaElementId = undefined;
          } else {
            state.zIndexMap[zIndex].elementId = undefined;
          }
        }
      },
      prepare: (0, _toolkit.prepareAutoBatched)()
    }
  }
});
var {
  registerZIndexPortal,
  unregisterZIndexPortal,
  registerZIndexPortalId,
  unregisterZIndexPortalId
} = zIndexSlice.actions;
exports.unregisterZIndexPortalId = unregisterZIndexPortalId;
exports.registerZIndexPortalId = registerZIndexPortalId;
exports.unregisterZIndexPortal = unregisterZIndexPortal;
exports.registerZIndexPortal = registerZIndexPortal;
var zIndexReducer = exports.zIndexReducer = zIndexSlice.reducer;