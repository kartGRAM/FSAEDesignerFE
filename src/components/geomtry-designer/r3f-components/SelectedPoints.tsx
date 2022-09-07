import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as R3F from '@react-three/fiber';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as THREE from 'three';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';

export default function SelectedPoints() {
  const points =
    useSelector((state: RootState) => state.uitgd.gdSceneState.selectedPoint) ??
    [];

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const colors = points.reduce((prev, current) => {
    if (!prev.length) {
      prev.push(current.color);
    } else if (prev[prev.length - 1] !== current.color) {
      prev.push(current.color);
    }
    return prev;
  }, [] as (number | undefined)[]);

  return (
    <>
      {colors.map((color) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ba = new THREE.BufferAttribute(
          new Float32Array(
            points
              .filter((point) => point.color === color)
              .map((point) => {
                const v = trans(point.point, coMatrix);
                return [v.x, v.y, v.z];
              })
              .flat()
          ),
          3
        );
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', ba);
        return (
          <points args={[geometry]} key={color}>
            <pointsMaterial
              sizeAttenuation
              args={[
                {
                  size: 20,
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
