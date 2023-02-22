import {isObject} from '@utils/helpers';
import {IControl} from '@gd/controls/IControls';

type SetterType = 'GlobalVariable' | 'Control';

export interface IParameterSetter {
  type: SetterType;
  targetNodeID: string;
  getData(): IDataParameterSetter;
}

export interface IDataParameterSetter {
  isDataParameterSetter: true;
  type: SetterType;
  targetNodeID: string;
}

function isDataParameterSetter(data: any): data is IDataParameterSetter {
  if (isObject(data) && data.isDataParameterSetter) return true;
  return false;
}

export class ParameterSetter implements IParameterSetter {
  type: SetterType;

  targetNodeID: string;

  getData(): IDataParameterSetter {
    return {
      isDataParameterSetter: true,
      type: this.type,
      targetNodeID: this.targetNodeID
    };
  }

  constructor(
    params: {type: SetterType; target: IControl} | IDataParameterSetter
  ) {
    this.type = params.type;
    if (isDataParameterSetter(params)) {
      const data = params;
      this.targetNodeID = data.targetNodeID;
    } else {
      this.targetNodeID = params.target.nodeID;
    }
  }
}
