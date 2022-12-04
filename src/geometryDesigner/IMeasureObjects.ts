import * as THREE from 'three';

type NodeID = string;

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

export interface ILine extends IMeasureObject {
  isLine: true;
  getThreeLine(): THREE.Line;
}

export interface IPoint extends IMeasureObject {
  isLine: true;
  getThreePoint(): THREE.Vector3;
}

export interface IPointNormalPlane extends IPlane {
  point: IPoint;
  direction: ILine;
  getData(): IDataPointNormalPlane;
}

export interface IDataPointNormalPlane extends IDataMeasureObject {
  point: NodeID;
  direction: NodeID;
}
