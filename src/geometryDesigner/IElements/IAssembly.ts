import {INamedVector3RO, INamedNumberRO} from '@gd/INamedValues';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {IElement, IDataElement, NodeID} from '../IElements';

export interface Joint {
  lhs: NodeID;
  rhs: NodeID;
}
export interface JointAsVector3 {
  lhs: INamedVector3RO;
  rhs: INamedVector3RO;
}
export interface DataJoint {
  lhs: NodeID;
  rhs: NodeID;
}

export const className = 'Assembly' as const;

export interface IAssembly extends IElement {
  isAssembly: true;
  children: IElement[];
  joints: Joint[];
  collectElements(): IAssembly;
  appendChild(children: IElement | IElement[]): void;
  getJointsAsVector3(): JointAsVector3[];

  getMeasurablePointsAll(): INamedVector3RO[];
  getVariablesAll(): INamedNumberRO[];
  getVariablesAllWithParent(): {parent: IElement; values: INamedNumberRO[]}[];
  getVariablesAllWithParentFlat(): {parent: IElement; value: INamedNumberRO}[];
  getJointedPoints(): INamedVector3RO[];
  getJointsRecursive(): Joint[];
  getAllPointsOfChildren(): INamedVector3RO[];
  getAllPointsNodeIDsOfChildren(): string[];
  flatten(noAssembly: boolean): IElement[];
  findElement(nodeID: string): IElement | undefined;

  getDataElement(state: GDState): IDataAssembly | undefined;
}

export interface IDataAssembly extends IDataElement {
  isDataAssembly: true;
  children: IDataElement[];
  joints: DataJoint[];
}

export const isAssembly = (element: IElement): element is IAssembly =>
  'isAssembly' in element;

export const isDataAssembly = (
  element: IDataElement
): element is IDataAssembly => 'isDataAssembly' in element;
