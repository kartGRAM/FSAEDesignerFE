import React from 'react';
import {isElement} from '@gd/IElements';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

import NodeSphere from './NodeSphere';

export default function SelectedPoints() {
  const points =
    useSelector((state: RootState) => state.uitgd.gdSceneState.selectedPoint) ??
    [];

  const pointsToRender = points.filter((point) => {
    const {parent} = point.point;
    if (isElement(parent)) {
      const nodes = parent.getPoints();
      const p = nodes.find((node) => node.nodeID === point.point.nodeID);
      return !p;
    }
    return true;
  });

  return (
    <>
      {pointsToRender.map((p) => (
        <NodeSphere node={p.point} key={p.point.nodeID} />
      ))}
    </>
  );
}
