import {Vector3} from 'three';
import {isObject} from '@utils/helpers';

export interface INearestNeighborToPlane {
  hasNearestNeighborToPlane: true;
  // あくまでも返すのは、コンポーネントローカル座標における最近傍点であることに注意
  getNearestNeighborToPlane(normal: Vector3, distance: number): Vector3;
}

export function hasNearestNeighborToPlane(
  object: any
): object is INearestNeighborToPlane {
  return isObject(object) && 'hasNearestNeighborToPlane' in object;
}
