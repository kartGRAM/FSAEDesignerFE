/* eslint-disable max-classes-per-file */
import {v4 as uuidv4} from 'uuid';
import {IAssembly} from '@gd/IElements';
import {ElementPoint} from '@gd/measure/PointObjects';
import {isDataElementPoint} from '@gd/measure/IPointObjects';
import {
  NodeID,
  IDatumObject,
  IDatumGroup,
  IDataDatumObject,
  IDataDatumGroup,
  IDatumManager,
  DatumDict,
  isDataDatumGroup
} from './IDatumObjects';

export class DatumGroup implements IDatumGroup {
  nodeID: NodeID;

  children: IDatumObject[];

  name: string;

  get visibility(): boolean | undefined {
    let allTrue = true;
    let allFalse = false;
    this.children.forEach((child) => {
      allTrue = allTrue && child.visibility;
      allFalse = allFalse || child.visibility;
    });
    if (allTrue) return true;
    if (!allFalse) return false;
    return undefined;
  }

  set visibility(value: boolean | undefined) {
    const visibility = !!value;
    this.children.forEach((child) => {
      child.visibility = visibility;
    });
  }

  update(ref: DatumDict, collectedAssembly: IAssembly): void {
    this.children.forEach((child) => {
      child.update(ref, collectedAssembly);
      ref[child.nodeID] = child;
    });
  }

  constructor(params: {name: string} | IDataDatumGroup) {
    this.name = params.name;
    this.nodeID = uuidv4();
    this.children = [];
    if (isDataDatumGroup(params)) {
      this.nodeID = params.nodeID;
      this.children = params.children.map((child) => getDatumObject(child));
    }
  }

  getData(): IDataDatumGroup {
    const children = this.children.map((child) => child.getData());
    return {
      nodeID: this.nodeID,
      isDataDatumGroup: true,
      name: this.name,
      children
    };
  }
}

export class DatumManager implements IDatumManager {
  children: IDatumGroup[];

  constructor(datumGroups: IDataDatumGroup[]) {
    this.children = datumGroups.map((child) => new DatumGroup(child));
  }

  getDatumObject(nodeID: NodeID): IDatumObject | undefined {
    for (const group of this.children) {
      for (const datum of group.children) {
        if (datum.nodeID === nodeID) {
          return datum;
        }
      }
    }
    return undefined;
  }

  update(collectedAssembly: IAssembly): void {
    const updated: DatumDict = {};
    this.children.forEach((child) => child.update(updated, collectedAssembly));
  }

  getData(): IDataDatumGroup[] {
    return this.children.map((child) => child.getData());
  }
}

function getDatumObject(data: IDataDatumObject): IDatumObject {
  if (isDataElementPoint(data)) return new ElementPoint(data);
  throw new Error('未実装のデータムを検出');
}
