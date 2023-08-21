import * as React from 'react';
import {useFrame} from '@react-three/fiber';

import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

const GroundPlane = () => {
  const grid = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showGroundPlaneGrid
  );

  useFrame(() => {});

  const length = 5000;
  const segmentLength = 200;
  const segments = Math.floor(length / segmentLength);

  if (!grid) return null;
  return <gridHelper args={[length, segments, 0x999999, 0x999999]} />;
};
export default GroundPlane;
