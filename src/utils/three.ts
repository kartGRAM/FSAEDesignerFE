import {Vector3, Quaternion, Spherical} from 'three';
import * as THREE from 'three';

export const isVector3 = (value: any): value is Vector3 => {
  try {
    return value.isVector3;
  } catch (e: any) {
    return false;
  }
};

export const getCameraQuaternion = (
  direction: Vector3 | Spherical
): Quaternion => {
  const v = new Vector3();
  if (isVector3(direction)) {
    v.copy(direction).normalize();
  } else {
    direction.radius = 1;
    direction.makeSafe();
    v.setFromSpherical(direction).multiplyScalar(-1);
  }
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), v);

  // Y軸が傾くので、傾き度合いを計算
  const v2 = new Vector3(0, 1, 0).applyQuaternion(q);

  // 画面奥行方向の傾きをなくして正規化
  v2.setZ(0).normalize();
  // 傾きを補正するだけZ軸周りに回転
  const q2 = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), v2);
  // クオータニオンの合成
  return q.multiply(q2);
};

export function isPerspectiveCamera(
  camera: THREE.Camera | undefined
): camera is THREE.PerspectiveCamera {
  return (
    camera instanceof THREE.PerspectiveCamera && camera.isPerspectiveCamera
  );
}

export function isOrthographicCamera(
  camera: THREE.Camera | undefined
): camera is THREE.OrthographicCamera {
  return (
    camera instanceof THREE.OrthographicCamera && camera.isOrthographicCamera
  );
}
