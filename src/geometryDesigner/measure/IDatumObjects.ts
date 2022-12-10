import * as THREE from 'three';

export type NodeID = string;

export interface IDatumObject {
  isDatumObject: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
  getData(): IDataDatumObject;
  update(ref: IDatumObject[]): void;
}
export function isDatumObject(data: any): data is IDatumObject {
  try {
    if (data.isDatumObject) return true;
    return false;
  } catch {
    return false;
  }
}

export interface IDataDatumObject {
  isDataDatumObject: true;
  readonly nodeID: string;
  readonly className: string;
  visibility: boolean;
  name: string;
}

export function isDataDatumObject(data: any): data is IDataDatumObject {
  try {
    if (data.isDataDatumObject) return true;
    return false;
  } catch {
    return false;
  }
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

export function isPoint(datum: any): datum is IPoint {
  try {
    if (datum.isPoint) return true;
    return false;
  } catch {
    return false;
  }
}

export interface IDataPoint extends IDataDatumObject {
  isDataPoint: true;
}

export interface IDatumGroup {
  readonly children: IDatumObject[];
  name: string;
  visibility: boolean | undefined;
  update(): void;
  getData(): IDataDatumGroup;
}

export interface IDataDatumGroup {
  isDataDatumGroup: true;
  children: IDataDatumObject[];
  name: string;
}

export function isDataDatumGroup(data: any): data is IDataDatumGroup {
  try {
    if (data.isDataDatumGroup) return true;
    return false;
  } catch {
    return false;
  }
}
