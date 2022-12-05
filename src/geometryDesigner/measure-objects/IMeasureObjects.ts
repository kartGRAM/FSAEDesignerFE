import * as THREE from 'three';

export type NodeID = string;

export interface IMeasureObject {
  readonly nodeID: string;
  readonly className: string;
  name: string;
  getData(): IDataMeasureObject;
}

export interface IDataMeasureObject {
  readonly nodeID: string;
  readonly className: string;
  name: string;
}

export interface IPlane extends IMeasureObject {
  isPlane: true;
  getThreePlane(): THREE.Plane;
}

export interface IDataPlane extends IDataMeasureObject {
  isDataPlane: true;
}

export interface ILine extends IMeasureObject {
  isLine: true;
  getThreeLine(): THREE.Line;
}

export interface IDataLine extends IDataMeasureObject {
  isDataLine: true;
}

export interface IPoint extends IMeasureObject {
  isPoint: true;
  getThreePoint(): THREE.Vector3;
}
