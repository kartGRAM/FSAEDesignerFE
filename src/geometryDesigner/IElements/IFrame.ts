import {IAssembly, IDataAssembly} from './IAssembly';

export const className = 'Frame' as const;

export interface IFrame extends IAssembly {}

export interface IDataFrame extends IDataAssembly {
  bodyID: string;
}

export const isFrame = (element: IAssembly): element is IFrame =>
  element.className === className;

export const isDataFrame = (element: IDataAssembly): element is IDataFrame =>
  element.className === className;
