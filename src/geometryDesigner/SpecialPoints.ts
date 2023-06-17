import {Vector3, Quaternion} from 'three';

export interface INearestNeighborToPlane {
  hasNearestNeighborToPlane: true;
  // あくまでも返すのは、コンポーネントローカル座標における最近傍点であることに注意
  getNearestNeighborToPlane(
    position: Vector3,
    rotation: Quaternion,
    normal: Vector3,
    distance: number
  ): Vector3;
}

export function hasNearestNeighborToPlane(
  object: any
): object is INearestNeighborToPlane {
  try {
    return 'hasNearestNeighborToPlane' in object;
  } catch (e) {
    return false;
  }
}
