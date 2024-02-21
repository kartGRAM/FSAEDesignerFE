import React from 'react';
import {useGLTF} from '@react-three/drei';
import {GLTF} from 'three-stdlib';
import {Color} from 'three';

type GLTFResult = GLTF & {
  nodes: {
    Body: THREE.Mesh;
  };
  materials: {
    body: THREE.MeshStandardMaterial;
  };
};

export function Cone(props: {
  color?: Color;
  groupProps?: JSX.IntrinsicElements['group'];
  clippingPlanes?: THREE.Plane[];
}) {
  const {color, groupProps, clippingPlanes} = props;
  const {nodes, materials} = useGLTF(
    '/static/React/assets/3DModel/cone.glb'
  ) as unknown as GLTFResult;
  const clonedMaterials = materials.body.clone();
  if (color) {
    clonedMaterials.color.set(color);
  }
  if (clippingPlanes) clonedMaterials.clippingPlanes = clippingPlanes;
  return (
    <group {...groupProps} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Body.geometry}
        material={clonedMaterials}
        rotation={[Math.PI / 2, 0, 0]}
        scale={3}
      />
    </group>
  );
}

useGLTF.preload('/static/React/assets/3DModel/cone.glb');
