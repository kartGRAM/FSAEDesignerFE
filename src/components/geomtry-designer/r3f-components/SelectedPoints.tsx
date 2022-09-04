import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as R3F from '@react-three/fiber';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as THREE from 'three';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {getVector3} from '@gd/NamedValues';

export default function SelectedPoints() {
  const points =
    useSelector((state: RootState) => state.uitgd.gdSceneState.selectedPoint) ??
    [];

  const colors = points.reduce((prev, current) => {
    if (!prev.length) {
      prev.push(current.color);
    } else if (prev[prev.length - 1] !== current.color) {
      prev.push(current.color);
    }
    return prev;
  }, [] as (number | undefined)[]);

  /* R3F.useFrame(() => {
    pRef.current!.geometry.attributes.position.needsUpdate = true;
  });
  // const p = new Array(1000).fill(0).map(() => (0.5 - Math.random()) * 7.5);
  // const ba = new BufferAttribute(new Float32Array(p), 3);
  // const pRef = React.useRef<THREE.Points>(null!);
   return (
    <points ref={pRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          {...ba}
          attach="attributes-position"
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={0xff00ff} sizeAttenuation />
    </points>
  ); */

  return (
    <>
      {colors.map((color) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ba = new THREE.BufferAttribute(
          new Float32Array(
            points
              .filter((point) => point.color === color)
              .map((point) => {
                const v = getVector3(point);
                return [v.x / 100, v.y / 100, v.z / 100];
              })
              .flat()
          ),
          3
        );
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', ba);
        return (
          <points args={[geometry]}>
            <pointsMaterial
              sizeAttenuation
              args={[
                {
                  size: 0.1,
                  color: color ?? 0xff0000
                }
              ]}
            />
          </points>
        );
      })}
    </>
  );
}
