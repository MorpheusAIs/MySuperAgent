"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultPolarRadiusAxisProps = void 0;
var _DefaultZIndexes = require("../zIndex/DefaultZIndexes");
var defaultPolarRadiusAxisProps = exports.defaultPolarRadiusAxisProps = {
  allowDataOverflow: false,
  allowDecimals: false,
  allowDuplicatedCategory: true,
  angle: 0,
  axisLine: true,
  cx: 0,
  cy: 0,
  includeHidden: false,
  orientation: 'right',
  radiusAxisId: 0,
  reversed: false,
  scale: 'auto',
  stroke: '#ccc',
  tick: true,
  tickCount: 5,
  type: 'number',
  zIndex: _DefaultZIndexes.DefaultZIndexes.axis
};