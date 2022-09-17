import * as React from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {Box} from '@react-three/drei';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {isBody} from '@gd/IElements';
import Body from './Body';

const CollectedAssembly = () => {
  const assembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );
  const groupRef = React.useRef<THREE.Group>(null!);
  const boxRef = React.useRef<THREE.Mesh>(null!);
  const children = assembly?.children ?? [];
  useFrame(() => {
    const box3 = new THREE.Box3().setFromObject(groupRef.current);
    const dimensions = new THREE.Vector3().subVectors(box3.max, box3.min);
    const boxGeo = new THREE.BoxBufferGeometry(
      dimensions.x,
      dimensions.y,
      dimensions.z
    );
    // move new mesh center so it's aligned with the original object
    const matrix = new THREE.Matrix4().setPosition(
      dimensions.addVectors(box3.min, box3.max).multiplyScalar(0.5)
    );
    boxGeo.applyMatrix4(matrix);
    boxRef.current.geometry.copy(boxGeo);
  });
  return (
    <>
      <group ref={groupRef}>
        {children.map((child) => {
          if (isBody(child)) return <Body element={child} key={child.nodeID} />;
          return null;
        })}
      </group>
      <Box ref={boxRef}>
        <meshBasicMaterial color="hotpink" wireframe wireframeLinewidth={3} />
      </Box>
    </>
  );
};
export default CollectedAssembly;
