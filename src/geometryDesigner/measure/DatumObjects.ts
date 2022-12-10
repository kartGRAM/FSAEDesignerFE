/* eslint-disable max-classes-per-file */
import {v4 as uuidv4} from 'uuid';
import {
  NodeID,
  IDatumObject,
  IDatumGroup,
  IDataDatumObject,
  IDataDatumGroup,
  isDataDatumObject,
  isDataDatumGroup
} from './IDatumObjects';

export abstract class DatumObject implements IDatumObject {
  readonly isDatumObject = true as const;

  readonly nodeID: string;

  abstract get className(): string;

  name: string;

  visibility: boolean = true;

  abstract getData(): IDataDatumObject;

  abstract update(): void;

  constructor(params: {name: string} | IDatumObject) {
    this.name = params.name;
    if (isDataDatumObject(params)) {
      this.nodeID = params.nodeID;
      this.visibility = params.visibility;
    } else {
      this.nodeID = uuidv4();
    }
  }

  getDataBase(): IDataDatumObject {
    return {
      isDataDatumObject: true,
      nodeID: this.nodeID,
      className: this.className,
      name: this.name,
      visibility: this.visibility
    };
  }
}

export class DatumGroup implements IDatumGroup {
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

  update(): void {
    this.children.forEach((child, i) =>
      child.update(this.children.slice(0, i + 1))
    );
  }

  constructor(params: {name: string} | IDataDatumGroup) {
    this.name = params.name;
    this.children = [];
    if (isDataDatumGroup(params)) {
      this.children = params.children.map((child) => getDatumObject(child));
    }
  }

  getData(): IDataDatumGroup {
    const children = this.children.map((child) => child.getData());
    return {
      isDataDatumGroup: true,
      name: this.name,
      children
    };
  }
}

export class DatumManager {
  children: DatumGroup[];

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

  update(): void {
    this.children.forEach((child) => child.update());
  }

  getData(): IDataDatumGroup[] {
    return this.children.map((child) => child.getData());
  }
}

function getDatumObject(data: IDataDatumObject): IDatumObject {
  throw new Error(data.name);
}
