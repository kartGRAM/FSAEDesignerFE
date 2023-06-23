import {Vector3} from 'three';

export interface INearestNeighborToPlane {
  hasNearestNeighborToPlane: true;
  // あくまでも返すのは、コンポーネントローカル座標における最近傍点であることに注意
  getNearestNeighborToPlane(normal: Vector3, distance: number): Vector3;
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
