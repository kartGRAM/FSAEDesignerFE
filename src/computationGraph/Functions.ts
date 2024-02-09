import {Matrix} from 'ml-matrix';

export type Vector3Like = {x: number; y: number; z: number};

export function skew(v: {x: number; y: number; z: number} | Matrix) {
  if ('x' in v) {
    return new Matrix([
      [0, -v.z, v.y],
      [v.z, 0, -v.x],
      [-v.y, v.x, 0]
    ]);
  }
  if (v.rows !== 3 || v.columns !== 3) throw new Error('Vector3でない');
  const x = v.get(0, 0);
  const y = v.get(1, 0);
  const z = v.get(2, 0);
  return new Matrix([
    [0, -z, y],
    [z, 0, -x],
    [-y, x, 0]
  ]);
}

export function getVVector(value: Vector3Like) {
  const {x, y, z} = value;
  return new Matrix([[x], [y], [z]]);
}
