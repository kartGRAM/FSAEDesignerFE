import * as React from 'react';
import {getSmoothStepPath, BaseEdge, SmoothStepEdgeProps} from 'reactflow';
import store from '@store/store';

export default function CustomStepEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  data,
  sourcePosition,
  targetPosition,
  markerEnd,
  markerStart,
  pathOptions,
  interactionWidth
}: SmoothStepEdgeProps) {
  const wSpace =
    store.getState().uigd.present.analysisPanelState.widthSpaceAligningNodes;
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: pathOptions?.borderRadius,
    offset: pathOptions?.offset,
    centerX: data?.toEndNode ? targetX - wSpace / 2 : undefined
  });

  return (
    <BaseEdge
      path={path}
      labelX={labelX}
      labelY={labelY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      style={style}
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={interactionWidth}
    />
  );
}
