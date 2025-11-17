import * as React from 'react';
import { useEffect } from 'react';
import { addZAxis, removeZAxis } from '../state/cartesianAxisSlice';
import { useAppDispatch } from '../state/hooks';
import { implicitZAxis } from '../state/selectors/axisSelectors';
import { resolveDefaultProps } from '../util/resolveDefaultProps';
function SetZAxisSettings(settings) {
  var dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(addZAxis(settings));
    return () => {
      dispatch(removeZAxis(settings));
    };
  }, [settings, dispatch]);
  return null;
}
var zAxisDefaultProps = {
  zAxisId: 0,
  range: implicitZAxis.range,
  scale: implicitZAxis.scale,
  type: implicitZAxis.type
};
export function ZAxis(outsideProps) {
  var props = resolveDefaultProps(outsideProps, zAxisDefaultProps);
  return /*#__PURE__*/React.createElement(SetZAxisSettings, {
    domain: props.domain,
    id: props.zAxisId,
    dataKey: props.dataKey,
    name: props.name,
    unit: props.unit,
    range: props.range,
    scale: props.scale,
    type: props.type,
    allowDuplicatedCategory: implicitZAxis.allowDuplicatedCategory,
    allowDataOverflow: implicitZAxis.allowDataOverflow,
    reversed: implicitZAxis.reversed,
    includeHidden: implicitZAxis.includeHidden
  });
}
ZAxis.displayName = 'ZAxis';