import React from 'react';
import {useFrame} from '@react-three/fiber';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  IMeasureTool,
  isPosition,
  isDistance,
  isAngle
} from '@gd/measure/measureTools/IMeasureTools';
import {Position} from './Position';
import {Distance} from './Distance';

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
  if (isDistance(tool)) return <Distance tool={tool} key={tool.nodeID} />;
  if (isAngle(tool)) return null;
  return null;
}
