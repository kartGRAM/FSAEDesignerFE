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
  fromVertices(vertices: Vector3[]): void;
  getNearestNeighborToLine(direction: Vector3, distance: number): void;
  getData(): IDataOBB;
}
