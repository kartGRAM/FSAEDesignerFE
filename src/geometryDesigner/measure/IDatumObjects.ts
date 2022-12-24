import * as THREE from 'three';
import {IAssembly} from '@gd/IElements';

export type NodeID = string;

export type DatumDict = {[index: string]: IDatumObject | undefined};

export interface IDatumObject {
  isDatumObject: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
  readonly description: string;
  getData(): IDataDatumObject;
  copy(other: IDatumObject): void;
  update(ref: DatumDict, collectedAssembly: IAssembly): void;
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

export function isPlane(datum: any): datum is IPlane {
  try {
    if (datum.isPlane) return true;
    return false;
  } catch {
    return false;
  }
}

export interface IDataPlane extends IDataDatumObject {
  isDataPlane: true;
}

export interface ILine extends IDatumObject {
  isLine: true;
  getThreeLine(): THREE.Line;
}

export function isLine(datum: any): datum is ILine {
  try {
    if (datum.isLine) return true;
    return false;
  } catch {
    return false;
  }
}

export interface IDataLine extends IDataDatumObject {
  isDataLine: true;
}

export interface IPoint extends IDatumObject {
  isPoint: true;
  getThreePoint(): THREE.Vector3;
  getData(): IDataPoint;
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
  lastPosition: {x: number; y: number; z: number};
}

export function isDataPoint(datum: any): datum is IPoint {
  try {
    if (datum.isDataPoint) return true;
    return false;
  } catch {
    return false;
  }
}

export interface IDatumGroup {
  children: IDatumObject[];
  readonly nodeID: NodeID;
  name: string;
  visibility: boolean | undefined;
  update(ref: DatumDict, collectedAssembly: IAssembly): void;
  getData(): IDataDatumGroup;
}

export interface IDataDatumGroup {
  readonly nodeID: NodeID;
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

export interface IDatumManager {
  children: IDatumGroup[];

  getDatumObject(nodeID: NodeID): IDatumObject | undefined;
  getDatumGroup(nodeID: NodeID): IDatumGroup | undefined;
  getObjectsAll(): IDatumObject[];

  update(): void;
  getData(): IDataDatumGroup[];
  dispatch(): void;
  addGroup(group: IDatumGroup): void;
  removeGroup(group: NodeID): void;
}
