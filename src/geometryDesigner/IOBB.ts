import {Vector3, Quaternion} from 'three';

export interface IDataOBB {
  isDataOBB: true;
  readonly center: [number, number, number];
  readonly halfSize: [number, number, number];
  readonly rotation: [number, number, number, number];
}

export interface IOBB {
  isOBB: true;
  readonly center: Vector3;
  readonly halfSize: Vector3;
  readonly rotation: Quaternion;
  setFromVertices(vertices: Vector3[]): IOBB;
  getNearestNeighborToLine(
    p: Vector3,
    v: Vector3,
    parentP?: Vector3,
    parentQ?: Quaternion
  ): {closest: Vector3; distance: number};
  getData(): IDataOBB;
}
