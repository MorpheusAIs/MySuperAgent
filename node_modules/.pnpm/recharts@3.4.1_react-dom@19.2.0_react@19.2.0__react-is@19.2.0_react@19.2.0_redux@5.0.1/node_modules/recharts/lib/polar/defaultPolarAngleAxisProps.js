"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultPolarAngleAxisProps = void 0;
var _DefaultZIndexes = require("../zIndex/DefaultZIndexes");
var defaultPolarAngleAxisProps = exports.defaultPolarAngleAxisProps = {
  allowDecimals: false,
  allowDuplicatedCategory: true,
  // if I set this to false then Tooltip synchronisation stops working in Radar, wtf
  angleAxisId: 0,
  axisLine: true,
  cx: 0,
  cy: 0,
  orientation: 'outer',
  reversed: false,
  scale: 'auto',
  tick: true,
  tickLine: true,
  tickSize: 8,
  type: 'category',
  zIndex: _DefaultZIndexes.DefaultZIndexes.axis
};