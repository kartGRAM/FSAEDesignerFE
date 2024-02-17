/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import {useFrame} from '@react-three/fiber';
import {Line2} from 'three-stdlib';
import {useSelector} from 'react-redux';
import {Line, CatmullRomLine} from '@react-three/drei';
import {RootState} from '@store/store';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';

import {LineDashedMaterial, Vector3} from 'three';

const GroundPlane = () => {
  const grid = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showGroundPlaneGrid
  );

  useFrame(() => {});

  const length = 5000;
  const segmentLength = 200;
  const segments = Math.floor(length / segmentLength);

  if (!grid) return null;
  return (
    <>
      <gridHelper args={[length, segments, 0x999999, 0x999999]} />
      <Ring />
    </>
  );
};
export default GroundPlane;

const Ring = () => {
  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );

  const getVertices = () => {
    const vertices: Vector3[] = [];
    const center = new Vector3(0, radius * 1000, 0);
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * radius * 1000;
      const y = Math.sin(theta) * radius * 1000;
      const v = new Vector3(x, y, 0);
      vertices.push(v.add(center));
    }
    return vertices;
  };

  const centerLineRef = React.useRef<Line2>(null);
  useFrame(() => {
    if (!centerLineRef.current) return;
    const a = 1;
  });

  // if (!solver || !isSkidpadSolver(solver)) return null;
  const radius = 1; // solver.r;
  const vtx = getVertices();
  return (
    <Line
      ref={centerLineRef}
      points={vtx} // Array of Points
      lineWidth={2}
      color="white"
      dashSize={20}
      gapSize={10}
      dashed
    />
  );
};
