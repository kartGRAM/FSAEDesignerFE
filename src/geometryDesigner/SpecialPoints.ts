import {Vector3, Quaternion} from 'three';

export interface INearestNeighborToPlane {
  hasNearestNeighborToPlane: true;
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
    return 'hasNearestNeightborToPlane' in object;
  } catch (e) {
    return false;
  }
}
