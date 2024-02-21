/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as THREE from 'three';
import {transQuaternion, IElement} from '@gd/IElements';
import {Box, Sphere} from '@react-three/drei';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {IOBB} from '@gd/IOBB';
import {useFrame} from '@react-three/fiber';

export const OBB = (props: {obb: IOBB; element?: IElement}) => {
  const {obb, element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const showOBB = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showOBB
  );

  const center = obb.center.clone().applyMatrix3(coMatrix);
  const halfSize = obb.halfSize.clone().applyMatrix3(coMatrix);
  const rotation = transQuaternion(obb.rotation, coMatrix);

  /* useFrame(() => {
    if (!element) return;
    const q = element.rotation.value;
    const invQ = q.clone().invert();
    const p = element.position.value;
    const {closest} = obb.getNearestNeighborToLine(
      new THREE.Vector3(0, 15000, 0),
      new THREE.Vector3(0, 0, 1),
      p,
      q
    );
    closest.sub(p).applyQuaternion(invQ).applyMatrix3(coMatrix);
    sphereRef.current.position.copy(closest);
  }); */

  if (!showOBB) return null;

  return (
    <>
      {/* element ? (
        <Sphere args={[10]} ref={sphereRef} material-color="hotpink" />
      ) : null */}
      <Box
        args={[halfSize.x * 2, halfSize.y * 2, halfSize.z * 2]}
        position={center}
        quaternion={rotation}
        material-color="hotpink"
        material-wireframe
      />
    </>
  );
};
export default OBB;
