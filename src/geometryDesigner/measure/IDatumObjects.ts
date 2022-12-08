import * as THREE from 'three';

export type NodeID = string;

export interface IDatumObject {
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
  getData(): IDataDatumObject;
  update(): void;
}

export interface IDataDatumObject {
  readonly nodeID: string;
  readonly className: string;
  visibility: boolean;
  name: string;
}

export interface IPlane extends IDatumObject {
  isPlane: true;
  getThreePlane(): THREE.Plane;
}

export interface IDataPlane extends IDataDatumObject {
  isDataPlane: true;
}

export interface ILine extends IDatumObject {
  isLine: true;
  getThreeLine(): THREE.Line;
}

export interface IDataLine extends IDataDatumObject {
  isDataLine: true;
}

export interface IPoint extends IDatumObject {
  isPoint: true;
  getThreePoint(): THREE.Vector3;
}

export interface IDataPoint extends IDataDatumObject {
  isDataPoint: true;
}

export interface IDatumGroup {
  readonly children: IDatumObject;
}
