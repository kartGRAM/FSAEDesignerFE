/* eslint-disable max-classes-per-file */
import {v4 as uuidv4} from 'uuid';
import {IAssembly} from '@gd/IElements';
import {
  IDatumObject,
  IDataDatumObject,
  isDataDatumObject,
  DatumDict
} from './IDatumObjects';

export abstract class DatumObject implements IDatumObject {
  readonly isDatumObject = true as const;

  readonly nodeID: string;

  abstract get className(): string;

  name: string;

  visibility: boolean = true;

  abstract getData(): IDataDatumObject;

  abstract update(ref: DatumDict, collectedAssembly: IAssembly): void;

  constructor(params: {name: string} | IDatumObject) {
    this.name = params.name;
    if (isDataDatumObject(params)) {
      this.nodeID = params.nodeID;
      this.visibility = params.visibility;
    } else {
      this.nodeID = uuidv4();
    }
  }

  abstract get description(): string;

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
