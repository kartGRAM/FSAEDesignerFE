/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  IMeasureTool,
  isPosition,
  isDistance,
  isAngle
} from '@gd/measure/IMeasureTools';
import {Position} from './Position';

export default function MeasureToolsRenderer() {
  const measureToolsManager = useSelector(
    (state: RootState) => state.uitgd.measureToolsManager
  );

  useFrame(() => {
    measureToolsManager?.update();
  });

  const tools = measureToolsManager?.children ?? [];

  return <>{tools.map((tool) => getTool(tool))}</>;
}

function getTool(tool: IMeasureTool) {
  if (!tool.visibility) return null;
  if (isPosition(tool)) return <Position tool={tool} key={tool.nodeID} />;
  if (isAngle(tool)) return null;
  if (isDistance(tool)) return null;
  return null;
}
