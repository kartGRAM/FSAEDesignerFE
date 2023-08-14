import * as THREE from 'three';
import {IAssembly} from '@gd/IElements';
import {isObject} from '@utils/helpers';

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
  return isObject(data) && data.isDatumObject;
}

export interface IDataDatumObject {
  isDataDatumObject: true;
  readonly nodeID: string;
  readonly className: string;
  visibility: boolean;
  name: string;
}

export function isDataDatumObject(data: any): data is IDataDatumObject {
  return isObject(data) && data.isDataDatumObject;
}

export interface IPlane extends IDatumObject {
  isPlane: true;
  getThreePlane(): THREE.Plane;
  readonly planeCenter: THREE.Vector3;
  readonly planeSize: {width: number; height: number};
}

export function isPlane(datum: any): datum is IPlane {
  return isObject(datum) && datum.isPlane;
}

export interface IDataPlane extends IDataDatumObject {
  isDataPlane: true;
  lastPosition: {
    normal: {x: number; y: number; z: number};
    constant: number;
  };
}

export function isDataPlane(datum: any): datum is IDataPlane {
  return isObject(datum) && datum.isDataPlane;
}

export interface ILine extends IDatumObject {
  isLine: true;
  getThreeLine(): THREE.Line3;
  readonly lineStart: THREE.Vector3;
  readonly lineEnd: THREE.Vector3;
}

export function isLine(datum: any): datum is ILine {
  return isObject(datum) && datum.isLine;
}

export interface IDataLine extends IDataDatumObject {
  isDataLine: true;
  lastPosition: {
    direction: {x: number; y: number; z: number};
    start: {x: number; y: number; z: number};
  };
}

export function isDataLine(datum: any): datum is IDataLine {
  return isObject(datum) && datum.isDataLine;
}

export interface IPoint extends IDatumObject {
  isPoint: true;
  getThreePoint(): THREE.Vector3;
  getData(): IDataPoint;
}

export function isPoint(datum: any): datum is IPoint {
  return isObject(datum) && datum.isPoint;
}

export interface IDataPoint extends IDataDatumObject {
  isDataPoint: true;
  lastPosition: {x: number; y: number; z: number};
}

export function isDataPoint(datum: any): datum is IDataPoint {
  return isObject(datum) && datum.isDataPoint;
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
  return isObject(data) && data.isDataDatumGroup;
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
