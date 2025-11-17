var _excluded = ["sourceX", "sourceY", "sourceControlX", "targetX", "targetY", "targetControlX", "linkWidth"],
  _excluded2 = ["className", "style", "children"];
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import maxBy from 'es-toolkit/compat/maxBy';
import sumBy from 'es-toolkit/compat/sumBy';
import get from 'es-toolkit/compat/get';
import { Surface } from '../container/Surface';
import { Layer } from '../container/Layer';
import { Rectangle } from '../shape/Rectangle';
import { getValueByDataKey } from '../util/ChartUtils';
import { ReportChartMargin, ReportChartSize, useChartHeight, useChartWidth } from '../context/chartLayoutContext';
import { TooltipPortalContext } from '../context/tooltipPortalContext';
import { RechartsWrapper } from './RechartsWrapper';
import { RechartsStoreProvider } from '../state/RechartsStoreProvider';
import { useAppDispatch } from '../state/hooks';
import { mouseLeaveItem, setActiveClickItemIndex, setActiveMouseOverItemIndex } from '../state/tooltipSlice';
import { SetTooltipEntrySettings } from '../state/SetTooltipEntrySettings';
import { SetComputedData } from '../context/chartDataContext';
import { svgPropertiesNoEvents, svgPropertiesNoEventsFromUnknown } from '../util/svgPropertiesNoEvents';
import { resolveDefaultProps } from '../util/resolveDefaultProps';
import { isPositiveNumber } from '../util/isWellBehavedNumber';
var interpolationGenerator = (a, b) => {
  var ka = +a;
  var kb = b - ka;
  return t => ka + kb * t;
};
var centerY = node => node.y + node.dy / 2;
var getValue = entry => entry && entry.value || 0;
var getSumOfIds = (links, ids) => ids.reduce((result, id) => result + getValue(links[id]), 0);
var getSumWithWeightedSource = (tree, links, ids) => ids.reduce((result, id) => {
  var link = links[id];
  var sourceNode = tree[link.source];
  return result + centerY(sourceNode) * getValue(links[id]);
}, 0);
var getSumWithWeightedTarget = (tree, links, ids) => ids.reduce((result, id) => {
  var link = links[id];
  var targetNode = tree[link.target];
  return result + centerY(targetNode) * getValue(links[id]);
}, 0);
var ascendingY = (a, b) => a.y - b.y;
var searchTargetsAndSources = (links, id) => {
  var sourceNodes = [];
  var sourceLinks = [];
  var targetNodes = [];
  var targetLinks = [];
  for (var i = 0, len = links.length; i < len; i++) {
    var link = links[i];
    if (link.source === id) {
      targetNodes.push(link.target);
      targetLinks.push(i);
    }
    if (link.target === id) {
      sourceNodes.push(link.source);
      sourceLinks.push(i);
    }
  }
  return {
    sourceNodes,
    sourceLinks,
    targetLinks,
    targetNodes
  };
};
var updateDepthOfTargets = (tree, curNode) => {
  var {
    targetNodes
  } = curNode;
  for (var i = 0, len = targetNodes.length; i < len; i++) {
    var target = tree[targetNodes[i]];
    if (target) {
      target.depth = Math.max(curNode.depth + 1, target.depth);
      updateDepthOfTargets(tree, target);
    }
  }
};
var getNodesTree = (_ref, width, nodeWidth, align) => {
  var _maxBy$depth, _maxBy;
  var {
    nodes,
    links
  } = _ref;
  var tree = nodes.map((entry, index) => {
    var result = searchTargetsAndSources(links, index);
    return _objectSpread(_objectSpread(_objectSpread({}, entry), result), {}, {
      value: Math.max(getSumOfIds(links, result.sourceLinks), getSumOfIds(links, result.targetLinks)),
      depth: 0
    });
  });
  for (var i = 0, len = tree.length; i < len; i++) {
    var node = tree[i];
    if (!node.sourceNodes.length) {
      updateDepthOfTargets(tree, node);
    }
  }
  var maxDepth = (_maxBy$depth = (_maxBy = maxBy(tree, entry => entry.depth)) === null || _maxBy === void 0 ? void 0 : _maxBy.depth) !== null && _maxBy$depth !== void 0 ? _maxBy$depth : 0;
  if (maxDepth >= 1) {
    var childWidth = (width - nodeWidth) / maxDepth;
    for (var _i = 0, _len = tree.length; _i < _len; _i++) {
      var _node = tree[_i];
      if (!_node.targetNodes.length) {
        if (align === 'justify') {
          _node.depth = maxDepth;
        }
      }
      _node.x = _node.depth * childWidth;
      _node.dx = nodeWidth;
    }
  }
  return {
    tree,
    maxDepth
  };
};
var getDepthTree = tree => {
  var result = [];
  for (var i = 0, len = tree.length; i < len; i++) {
    var node = tree[i];
    if (!result[node.depth]) {
      result[node.depth] = [];
    }
    result[node.depth].push(node);
  }
  return result;
};
var updateYOfTree = (depthTree, height, nodePadding, links, verticalAlign) => {
  var yRatio = Math.min(...depthTree.map(nodes => (height - (nodes.length - 1) * nodePadding) / sumBy(nodes, getValue)));
  for (var d = 0, maxDepth = depthTree.length; d < maxDepth; d++) {
    var nodes = depthTree[d];
    if (verticalAlign === 'top') {
      var currentY = 0;
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = nodes[i];
        node.dy = node.value * yRatio;
        node.y = currentY;
        currentY += node.dy + nodePadding;
      }
    } else {
      for (var _i2 = 0, _len2 = nodes.length; _i2 < _len2; _i2++) {
        var _node2 = nodes[_i2];
        _node2.y = _i2;
        _node2.dy = _node2.value * yRatio;
      }
    }
  }
  return links.map(link => _objectSpread(_objectSpread({}, link), {}, {
    dy: getValue(link) * yRatio
  }));
};
var resolveCollisions = function resolveCollisions(depthTree, height, nodePadding) {
  var sort = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  for (var i = 0, len = depthTree.length; i < len; i++) {
    var nodes = depthTree[i];
    var n = nodes.length;

    // Sort by the value of y
    if (sort) {
      nodes.sort(ascendingY);
    }
    var y0 = 0;
    for (var j = 0; j < n; j++) {
      var node = nodes[j];
      var dy = y0 - node.y;
      if (dy > 0) {
        node.y += dy;
      }
      y0 = node.y + node.dy + nodePadding;
    }
    y0 = height + nodePadding;
    for (var _j = n - 1; _j >= 0; _j--) {
      var _node3 = nodes[_j];
      var _dy = _node3.y + _node3.dy + nodePadding - y0;
      if (_dy > 0) {
        _node3.y -= _dy;
        y0 = _node3.y;
      } else {
        break;
      }
    }
  }
};
var relaxLeftToRight = (tree, depthTree, links, alpha) => {
  for (var i = 0, maxDepth = depthTree.length; i < maxDepth; i++) {
    var nodes = depthTree[i];
    for (var j = 0, len = nodes.length; j < len; j++) {
      var node = nodes[j];
      if (node.sourceLinks.length) {
        var sourceSum = getSumOfIds(links, node.sourceLinks);
        var weightedSum = getSumWithWeightedSource(tree, links, node.sourceLinks);
        var y = weightedSum / sourceSum;
        node.y += (y - centerY(node)) * alpha;
      }
    }
  }
};
var relaxRightToLeft = (tree, depthTree, links, alpha) => {
  for (var i = depthTree.length - 1; i >= 0; i--) {
    var nodes = depthTree[i];
    for (var j = 0, len = nodes.length; j < len; j++) {
      var node = nodes[j];
      if (node.targetLinks.length) {
        var targetSum = getSumOfIds(links, node.targetLinks);
        var weightedSum = getSumWithWeightedTarget(tree, links, node.targetLinks);
        var y = weightedSum / targetSum;
        node.y += (y - centerY(node)) * alpha;
      }
    }
  }
};
var updateYOfLinks = (tree, links) => {
  for (var i = 0, len = tree.length; i < len; i++) {
    var node = tree[i];
    var sy = 0;
    var ty = 0;
    node.targetLinks.sort((a, b) => tree[links[a].target].y - tree[links[b].target].y);
    node.sourceLinks.sort((a, b) => tree[links[a].source].y - tree[links[b].source].y);
    for (var j = 0, tLen = node.targetLinks.length; j < tLen; j++) {
      var link = links[node.targetLinks[j]];
      if (link) {
        // @ts-expect-error we should refactor this to immutable
        link.sy = sy;
        sy += link.dy;
      }
    }
    for (var _j2 = 0, sLen = node.sourceLinks.length; _j2 < sLen; _j2++) {
      var _link = links[node.sourceLinks[_j2]];
      if (_link) {
        // @ts-expect-error we should refactor this to immutable
        _link.ty = ty;
        ty += _link.dy;
      }
    }
  }
};
var computeData = _ref2 => {
  var {
    data,
    width,
    height,
    iterations,
    nodeWidth,
    nodePadding,
    sort,
    verticalAlign,
    align
  } = _ref2;
  var {
    links
  } = data;
  var {
    tree
  } = getNodesTree(data, width, nodeWidth, align);
  var depthTree = getDepthTree(tree);
  var linksWithDy = updateYOfTree(depthTree, height, nodePadding, links, verticalAlign);
  resolveCollisions(depthTree, height, nodePadding, sort);
  if (verticalAlign === 'justify') {
    var alpha = 1;
    for (var i = 1; i <= iterations; i++) {
      relaxRightToLeft(tree, depthTree, linksWithDy, alpha *= 0.99);
      resolveCollisions(depthTree, height, nodePadding, sort);
      relaxLeftToRight(tree, depthTree, linksWithDy, alpha);
      resolveCollisions(depthTree, height, nodePadding, sort);
    }
  }
  updateYOfLinks(tree, linksWithDy);
  // @ts-expect-error updateYOfLinks modifies the links array to add sy and ty in place
  var newLinks = linksWithDy;
  return {
    nodes: tree,
    links: newLinks
  };
};
var getNodeCoordinateOfTooltip = item => {
  return {
    x: +item.x + +item.width / 2,
    y: +item.y + +item.height / 2
  };
};
var getLinkCoordinateOfTooltip = item => {
  return 'sourceX' in item ? {
    x: (item.sourceX + item.targetX) / 2,
    y: (item.sourceY + item.targetY) / 2
  } : undefined;
};
var getPayloadOfTooltip = (item, type, nameKey) => {
  var {
    payload
  } = item;
  if (type === 'node') {
    return {
      payload,
      name: getValueByDataKey(payload, nameKey, ''),
      value: getValueByDataKey(payload, 'value')
    };
  }
  if ('source' in payload && payload.source && payload.target) {
    var sourceName = getValueByDataKey(payload.source, nameKey, '');
    var targetName = getValueByDataKey(payload.target, nameKey, '');
    return {
      payload,
      name: "".concat(sourceName, " - ").concat(targetName),
      value: getValueByDataKey(payload, 'value')
    };
  }
  return undefined;
};
export var sankeyPayloadSearcher = (_, activeIndex, computedData, nameKey) => {
  if (activeIndex == null || typeof activeIndex !== 'string') {
    return undefined;
  }
  var splitIndex = activeIndex.split('-');
  var [targetType, index] = splitIndex;
  var item = get(computedData, "".concat(targetType, "s[").concat(index, "]"));
  if (item) {
    var payload = getPayloadOfTooltip(item, targetType, nameKey);
    return payload;
  }
  return undefined;
};
var options = {
  chartName: 'Sankey',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: sankeyPayloadSearcher,
  eventEmitter: undefined
};
function getTooltipEntrySettings(props) {
  var {
    dataKey,
    nameKey,
    stroke,
    strokeWidth,
    fill,
    name,
    data
  } = props;
  return {
    dataDefinedOnItem: data,
    positions: undefined,
    settings: {
      stroke,
      strokeWidth,
      fill,
      dataKey,
      name,
      nameKey,
      color: fill,
      unit: '' // Sankey does not have unit, why?
    }
  };
}

// TODO: improve types - NodeOptions uses SankeyNode, LinkOptions uses LinkProps. Standardize.

function renderLinkItem(option, props) {
  if (/*#__PURE__*/React.isValidElement(option)) {
    return /*#__PURE__*/React.cloneElement(option, props);
  }
  if (typeof option === 'function') {
    return option(props);
  }
  var {
      sourceX,
      sourceY,
      sourceControlX,
      targetX,
      targetY,
      targetControlX,
      linkWidth
    } = props,
    others = _objectWithoutProperties(props, _excluded);
  return /*#__PURE__*/React.createElement("path", _extends({
    className: "recharts-sankey-link",
    d: "\n          M".concat(sourceX, ",").concat(sourceY, "\n          C").concat(sourceControlX, ",").concat(sourceY, " ").concat(targetControlX, ",").concat(targetY, " ").concat(targetX, ",").concat(targetY, "\n        "),
    fill: "none",
    stroke: "#333",
    strokeWidth: linkWidth,
    strokeOpacity: "0.2"
  }, svgPropertiesNoEvents(others)));
}
var buildLinkProps = _ref3 => {
  var {
    link,
    nodes,
    left,
    top,
    i,
    linkContent,
    linkCurvature
  } = _ref3;
  var {
    sy: sourceRelativeY,
    ty: targetRelativeY,
    dy: linkWidth
  } = link;
  var sourceNode = nodes[link.source];
  var targetNode = nodes[link.target];
  var sourceX = sourceNode.x + sourceNode.dx + left;
  var targetX = targetNode.x + left;
  var interpolationFunc = interpolationGenerator(sourceX, targetX);
  var sourceControlX = interpolationFunc(linkCurvature);
  var targetControlX = interpolationFunc(1 - linkCurvature);
  var sourceY = sourceNode.y + sourceRelativeY + linkWidth / 2 + top;
  var targetY = targetNode.y + targetRelativeY + linkWidth / 2 + top;
  var linkProps = _objectSpread({
    sourceX,
    // @ts-expect-error the linkContent from below is contributing unknown props
    targetX,
    sourceY,
    // @ts-expect-error the linkContent from below is contributing unknown props
    targetY,
    sourceControlX,
    targetControlX,
    sourceRelativeY,
    targetRelativeY,
    linkWidth,
    index: i,
    payload: _objectSpread(_objectSpread({}, link), {}, {
      source: sourceNode,
      target: targetNode
    })
  }, svgPropertiesNoEventsFromUnknown(linkContent));
  return linkProps;
};
function SankeyLinkElement(_ref4) {
  var {
    props,
    i,
    linkContent,
    onMouseEnter: _onMouseEnter,
    onMouseLeave: _onMouseLeave,
    onClick: _onClick,
    dataKey
  } = _ref4;
  var activeCoordinate = getLinkCoordinateOfTooltip(props);
  var activeIndex = "link-".concat(i);
  var dispatch = useAppDispatch();
  var events = {
    onMouseEnter: e => {
      dispatch(setActiveMouseOverItemIndex({
        activeIndex,
        activeDataKey: dataKey,
        activeCoordinate
      }));
      _onMouseEnter(props, e);
    },
    onMouseLeave: e => {
      dispatch(mouseLeaveItem());
      _onMouseLeave(props, e);
    },
    onClick: e => {
      dispatch(setActiveClickItemIndex({
        activeIndex,
        activeDataKey: dataKey,
        activeCoordinate
      }));
      _onClick(props, e);
    }
  };
  return /*#__PURE__*/React.createElement(Layer, events, renderLinkItem(linkContent, props));
}
function AllSankeyLinkElements(_ref5) {
  var {
    modifiedLinks,
    links,
    linkContent,
    onMouseEnter,
    onMouseLeave,
    onClick,
    dataKey
  } = _ref5;
  return /*#__PURE__*/React.createElement(Layer, {
    className: "recharts-sankey-links",
    key: "recharts-sankey-links"
  }, links.map((link, i) => {
    var linkProps = modifiedLinks[i];
    return /*#__PURE__*/React.createElement(SankeyLinkElement, {
      key: "link-".concat(link.source, "-").concat(link.target, "-").concat(link.value),
      props: linkProps,
      linkContent: linkContent,
      i: i,
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave,
      onClick: onClick,
      dataKey: dataKey
    });
  }));
}
function renderNodeItem(option, props) {
  if (/*#__PURE__*/React.isValidElement(option)) {
    return /*#__PURE__*/React.cloneElement(option, props);
  }
  if (typeof option === 'function') {
    return option(props);
  }
  return (
    /*#__PURE__*/
    // @ts-expect-error recharts radius is not compatible with SVG radius
    React.createElement(Rectangle, _extends({
      className: "recharts-sankey-node",
      fill: "#0088fe",
      fillOpacity: "0.8"
    }, svgPropertiesNoEvents(props)))
  );
}
var buildNodeProps = _ref6 => {
  var {
    node,
    nodeContent,
    top,
    left,
    i
  } = _ref6;
  var {
    x,
    y,
    dx,
    dy
  } = node;
  // @ts-expect-error nodeContent is passing in unknown props
  var nodeProps = _objectSpread(_objectSpread({}, svgPropertiesNoEventsFromUnknown(nodeContent)), {}, {
    x: x + left,
    y: y + top,
    width: dx,
    height: dy,
    index: i,
    payload: node
  });
  return nodeProps;
};
function NodeElement(_ref7) {
  var {
    props,
    nodeContent,
    i,
    onMouseEnter: _onMouseEnter2,
    onMouseLeave: _onMouseLeave2,
    onClick: _onClick2,
    dataKey
  } = _ref7;
  var dispatch = useAppDispatch();
  var activeCoordinate = getNodeCoordinateOfTooltip(props);
  var activeIndex = "node-".concat(i);
  var events = {
    onMouseEnter: e => {
      dispatch(setActiveMouseOverItemIndex({
        activeIndex,
        activeDataKey: dataKey,
        activeCoordinate
      }));
      _onMouseEnter2(props, e);
    },
    onMouseLeave: e => {
      dispatch(mouseLeaveItem());
      _onMouseLeave2(props, e);
    },
    onClick: e => {
      dispatch(setActiveClickItemIndex({
        activeIndex,
        activeDataKey: dataKey,
        activeCoordinate
      }));
      _onClick2(props, e);
    }
  };
  return /*#__PURE__*/React.createElement(Layer, events, renderNodeItem(nodeContent, props));
}
function AllNodeElements(_ref8) {
  var {
    modifiedNodes,
    nodeContent,
    onMouseEnter,
    onMouseLeave,
    onClick,
    dataKey
  } = _ref8;
  return /*#__PURE__*/React.createElement(Layer, {
    className: "recharts-sankey-nodes",
    key: "recharts-sankey-nodes"
  }, modifiedNodes.map((modifiedNode, i) => {
    return /*#__PURE__*/React.createElement(NodeElement, {
      key: "node-".concat(modifiedNode.index, "-").concat(modifiedNode.x, "-").concat(modifiedNode.y),
      props: modifiedNode,
      nodeContent: nodeContent,
      i: i,
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave,
      onClick: onClick,
      dataKey: dataKey
    });
  }));
}
var sankeyDefaultProps = {
  nameKey: 'name',
  dataKey: 'value',
  nodePadding: 10,
  nodeWidth: 10,
  linkCurvature: 0.5,
  iterations: 32,
  margin: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
  },
  sort: true,
  verticalAlign: 'justify',
  align: 'justify'
};
function SankeyImpl(props) {
  var {
      className,
      style,
      children
    } = props,
    others = _objectWithoutProperties(props, _excluded2);
  var {
    link,
    dataKey,
    node,
    onMouseEnter,
    onMouseLeave,
    onClick,
    data,
    iterations,
    nodeWidth,
    nodePadding,
    sort,
    linkCurvature,
    margin,
    verticalAlign,
    align
  } = props;
  var attrs = svgPropertiesNoEvents(others);
  var width = useChartWidth();
  var height = useChartHeight();
  var {
    links,
    modifiedLinks,
    modifiedNodes
  } = useMemo(() => {
    var _margin$left, _margin$right, _margin$top, _margin$bottom;
    if (!data || !width || !height || width <= 0 || height <= 0) {
      return {
        nodes: [],
        links: [],
        modifiedLinks: [],
        modifiedNodes: []
      };
    }
    var contentWidth = width - ((_margin$left = margin.left) !== null && _margin$left !== void 0 ? _margin$left : 0) - ((_margin$right = margin.right) !== null && _margin$right !== void 0 ? _margin$right : 0);
    var contentHeight = height - ((_margin$top = margin.top) !== null && _margin$top !== void 0 ? _margin$top : 0) - ((_margin$bottom = margin.bottom) !== null && _margin$bottom !== void 0 ? _margin$bottom : 0);
    var computed = computeData({
      data,
      width: contentWidth,
      height: contentHeight,
      iterations,
      nodeWidth,
      nodePadding,
      sort,
      verticalAlign,
      align
    });
    var top = margin.top || 0;
    var left = margin.left || 0;
    var newModifiedLinks = computed.links.map((l, i) => {
      return buildLinkProps({
        link: l,
        nodes: computed.nodes,
        i,
        top,
        left,
        linkContent: link,
        linkCurvature
      });
    });
    var newModifiedNodes = computed.nodes.map((n, i) => {
      return buildNodeProps({
        node: n,
        nodeContent: node,
        i,
        top,
        left
      });
    });
    return {
      nodes: computed.nodes,
      links: computed.links,
      modifiedLinks: newModifiedLinks,
      modifiedNodes: newModifiedNodes
    };
  }, [data, width, height, margin, iterations, nodeWidth, nodePadding, sort, link, node, linkCurvature, align, verticalAlign]);
  var handleMouseEnter = useCallback((item, type, e) => {
    if (onMouseEnter) {
      onMouseEnter(item, type, e);
    }
  }, [onMouseEnter]);
  var handleMouseLeave = useCallback((item, type, e) => {
    if (onMouseLeave) {
      onMouseLeave(item, type, e);
    }
  }, [onMouseLeave]);
  var handleClick = useCallback((item, type, e) => {
    if (onClick) {
      onClick(item, type, e);
    }
  }, [onClick]);
  if (!isPositiveNumber(width) || !isPositiveNumber(height) || !data || !data.links || !data.nodes) {
    return null;
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SetComputedData, {
    computedData: {
      links: modifiedLinks,
      nodes: modifiedNodes
    }
  }), /*#__PURE__*/React.createElement(Surface, _extends({}, attrs, {
    width: width,
    height: height
  }), children, /*#__PURE__*/React.createElement(AllSankeyLinkElements, {
    links: links,
    modifiedLinks: modifiedLinks,
    linkContent: link,
    dataKey: dataKey,
    onMouseEnter: (linkProps, e) => handleMouseEnter(linkProps, 'link', e),
    onMouseLeave: (linkProps, e) => handleMouseLeave(linkProps, 'link', e),
    onClick: (linkProps, e) => handleClick(linkProps, 'link', e)
  }), /*#__PURE__*/React.createElement(AllNodeElements, {
    modifiedNodes: modifiedNodes,
    nodeContent: node,
    dataKey: dataKey,
    onMouseEnter: (nodeProps, e) => handleMouseEnter(nodeProps, 'node', e),
    onMouseLeave: (nodeProps, e) => handleMouseLeave(nodeProps, 'node', e),
    onClick: (nodeProps, e) => handleClick(nodeProps, 'node', e)
  })));
}
export function Sankey(outsideProps) {
  var props = resolveDefaultProps(outsideProps, sankeyDefaultProps);
  var {
    width,
    height,
    style,
    className
  } = props;
  var [tooltipPortal, setTooltipPortal] = useState(null);
  return /*#__PURE__*/React.createElement(RechartsStoreProvider, {
    preloadedState: {
      options
    },
    reduxStoreName: className !== null && className !== void 0 ? className : 'Sankey'
  }, /*#__PURE__*/React.createElement(SetTooltipEntrySettings, {
    fn: getTooltipEntrySettings,
    args: props
  }), /*#__PURE__*/React.createElement(ReportChartSize, {
    width: width,
    height: height
  }), /*#__PURE__*/React.createElement(ReportChartMargin, {
    margin: props.margin
  }), /*#__PURE__*/React.createElement(RechartsWrapper, {
    className: className,
    style: style,
    width: width,
    height: height
    /*
     * Sankey, same as Treemap, suffers from overfilling the container
     * and causing infinite render loops where the chart keeps growing.
     */,
    responsive: false,
    ref: node => {
      if (node && !tooltipPortal) {
        setTooltipPortal(node);
      }
    },
    onMouseEnter: undefined,
    onMouseLeave: undefined,
    onClick: undefined,
    onMouseMove: undefined,
    onMouseDown: undefined,
    onMouseUp: undefined,
    onContextMenu: undefined,
    onDoubleClick: undefined,
    onTouchStart: undefined,
    onTouchMove: undefined,
    onTouchEnd: undefined
  }, /*#__PURE__*/React.createElement(TooltipPortalContext.Provider, {
    value: tooltipPortal
  }, /*#__PURE__*/React.createElement(SankeyImpl, props))));
}
Sankey.displayName = 'Sankey';