/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as THREE from 'three';
import {transQuaternion} from '@gd/IElements';
import {Box} from '@react-three/drei';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {IOBB} from '@gd/IOBB';

export const OBB = (props: {obb: IOBB}) => {
  const {obb} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const center = obb.center.clone().applyMatrix3(coMatrix);
  const halfSize = obb.halfSize.clone().applyMatrix3(coMatrix);
  const rotation = transQuaternion(obb.rotation, coMatrix);

  return (
    <Box
      args={[halfSize.x * 2, halfSize.y * 2, halfSize.z * 2]}
      position={center}
      quaternion={rotation}
      material-color="hotpink"
      material-wireframe
    />
  );
};
export default OBB;
