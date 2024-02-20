import React from 'react';
import {useGLTF} from '@react-three/drei';
import {GLTF} from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    Body: THREE.Mesh;
  };
  materials: {
    body: THREE.MeshStandardMaterial;
  };
};

export function Cone(props: JSX.IntrinsicElements['group']) {
  const {nodes, materials} = useGLTF(
    '/static/React/assets/3DModel/cone.glb'
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Body.geometry}
        material={materials.body}
        rotation={[Math.PI / 2, 0, 0]}
        scale={3}
      />
    </group>
  );
}

useGLTF.preload('/static/React/assets/3DModel/cone.glb');
