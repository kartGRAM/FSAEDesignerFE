/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {Plane} from '@react-three/drei';

import {getMatrix3} from '@gd/NamedValues';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

const GroundPlane = () => {
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const grid = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showGroundPlaneGrid
  );

  useFrame(() => {});

  const length = 5000;
  const segmentLength = 200;
  const segments = Math.floor(length / segmentLength);

  if (!grid) return null;
  return (
    <Plane
      args={[length, length, segments, segments]}
      position={[0, 0, 0]}
      rotation={new THREE.Euler().setFromRotationMatrix(
        new THREE.Matrix4().setFromMatrix3(coMatrix)
      )}
    >
      <meshBasicMaterial
        args={[{color: 0x999999}]}
        wireframe
        wireframeLinewidth={1}
      />
    </Plane>
  );
};
export default GroundPlane;
