/* eslint-disable max-classes-per-file */
import {Vector3, Matrix3} from 'three';
import {IElement} from '@gd/IElements';
import {v1 as uuidv1} from 'uuid';
import {Formula} from '@gd/Formula';
import {
  isData,
  IDataVector3,
  IDataMatrix3,
  IDataNumber,
  IData,
  INamedValue,
  INamedNumber,
  INamedString,
  INamedBoolean,
  INamedBooleanOrUndefined,
  INamedVector3,
  INamedMatrix3
} from '@gd/IDataValues';

/* export interface IData {
  className: string;
}

const isData = (
  params: IDataVector3 | INamedVector3Constructor
): params is IDataVector3 => 'className' in params;
*/

export const getVector3 = (data: IDataVector3): Vector3 => {
  return new Vector3(data.x, data.y, data.z);
};

export const getDataVector3 = (value: Vector3): IDataVector3 => {
  const {x, y, z} = value;
  return {x, y, z, name: 'tempData'};
};

export const getMatrix3 = (data: IDataMatrix3): Matrix3 => {
  const tmp = new Matrix3();
  tmp.elements = [...data.elements];
  return tmp;
};

interface INamedValueConstructor {
  parent: IElement;
  name: string;
  className: string;
}

abstract class NamedValue implements INamedValue {
  readonly className: string;

  readonly parent: IElement;

  readonly nodeID: string;

  name: string;

  get absPath(): string {
    return `${this.nodeID}@${this.parent.absPath}`;
  }

  abstract get value(): unknown;

  abstract set value(newValue: unknown);

  abstract getData(): unknown;

  constructor(params: INamedValueConstructor) {
    const {className, parent, name} = params;
    this.className = className;
    this.parent = parent;
    this.name = name;
    this.nodeID = uuidv1();
  }
}

interface INamedPrimitiveConstructor<T> {
  name: string;
  value: T | IData<T>;
  update?: (newValue: T) => void;
  parent: IElement;
}

export class NamedPrimitive<T> extends NamedValue {
  _value: T;

  private _update: (newValue: T) => void;

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    this._update(newValue);
  }

  constructor(params: INamedPrimitiveConstructor<T>) {
    const {name: defaultName, value, update} = params;
    super({
      className: typeof value,
      ...params,
      name: isData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: T) => {
        this._value = newValue;
      });
    this._value = isData(value) ? value.value : value;
  }

  getData(): IData<T> {
    return {
      name: this.name,
      value: this.value
    };
  }
}

interface INamedNumberConstructor {
  name: string;
  value: string | number | IDataNumber;
  update?: (valueOrFormula: string | number) => void;
  parent: IElement;
}

export class NamedNumber extends NamedValue implements INamedNumber {
  _value: number;

  formula: Formula | undefined;

  private _update: (valueOrFOrmula: string | number) => void;

  get value(): number {
    if (this.formula) return this.formula.evaluatedValue;
    return this._value;
  }

  set value(newValue: number | string) {
    this._update(newValue);
  }

  constructor(params: INamedNumberConstructor) {
    const {name: defaultName, value, update} = params;
    super({
      className: typeof value,
      ...params,
      name: isData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: string | number) => {
        const formula = typeof newValue === 'string' ? newValue : undefined;
        this.formula = undefined;
        if (formula !== undefined) {
          this.formula = new Formula({
            name: this.name,
            formula,
            absPath: this.absPath
          });
        }
        this._value = this.formula
          ? this.formula.evaluatedValue
          : (value as number);
      });
    if (isData(value)) {
      this._value = value.value;
      this.formula = value.formula ? new Formula(value.formula) : undefined;
    } else {
      const formula = typeof value === 'string' ? value : undefined;
      this.formula = undefined;
      if (formula !== undefined) {
        this.formula = new Formula({
          name: this.name,
          formula,
          absPath: this.absPath
        });
      }
      this._value = this.formula
        ? this.formula.evaluatedValue
        : (value as number);
    }
  }

  getData(): IDataNumber {
    return {
      name: this.name,
      value: this.value,
      formula: this.formula?.getData()
    };
  }
}
export class NamedString
  extends NamedPrimitive<string>
  implements INamedString {}
export class NamedBoolean
  extends NamedPrimitive<boolean>
  implements INamedBoolean {}

export function isNamedString(value: INamedValue): value is NamedString {
  return value.className === 'string';
}
export function isNamedNumber(value: INamedValue): value is NamedNumber {
  return value.className === 'number';
}
export function isNamedBoolean(value: INamedValue): value is NamedBoolean {
  return value.className === 'boolean';
}

export class NamedBooleanOrUndefined
  extends NamedValue
  implements INamedBooleanOrUndefined
{
  _value: boolean | undefined;

  private _update: (newValue: boolean | undefined) => void;

  get value(): boolean | undefined {
    return this._value;
  }

  set value(newValue: boolean | undefined) {
    this._update(newValue);
  }

  constructor(params: INamedPrimitiveConstructor<boolean | undefined>) {
    const {name: defaultName, value, update} = params;
    super({
      className: typeof value,
      ...params,
      name: isData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: boolean | undefined) => {
        this._value = newValue;
      });
    this._value = isData(value) ? value.value : value;
  }

  getData(): IData<boolean | undefined> {
    return {
      name: this.name,
      value: this.value
    };
  }
}

export function isNamedBooleanOrUndefined(
  value: INamedValue
): value is NamedBooleanOrUndefined {
  return value.className === 'boolean|undefined';
}

interface INamedVector3Constructor {
  name: string;
  parent: IElement;
  value?: Vector3 | IDataVector3;
  update?: (newValue: Vector3) => this;
}

export class NamedVector3 extends NamedValue implements INamedVector3 {
  _value: Vector3;

  private _update: (newValue: Vector3) => void;

  get value(): Vector3 {
    return this._value;
  }

  set value(newValue: Vector3) {
    this._update(newValue);
  }

  constructor(params: INamedVector3Constructor) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'Vector3',
      ...params,
      name: isData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: Vector3) => {
        this._value = newValue.clone();
      });
    if (value) {
      const {x, y, z} = value;
      this._value = new Vector3(x, y, z);
    } else {
      this._value = new Vector3();
    }
  }

  getData(): IDataVector3 {
    return {
      name: this.name,
      x: this.value.x,
      y: this.value.y,
      z: this.value.z
    };
  }
}
export function isNamedVector3(value: INamedValue): value is NamedVector3 {
  return value.className === 'Vector3';
}

interface INamedMatrix3Constructor {
  name: string;
  parent: IElement;
  value?: IDataMatrix3 | Matrix3;
  update?: (newValue: Matrix3) => this;
}

export class NamedMatrix3 extends NamedValue implements INamedMatrix3 {
  private _update: (newValue: Matrix3) => void;

  _value: Matrix3;

  get value(): Matrix3 {
    return this._value;
  }

  set value(newValue: Matrix3) {
    this._update(newValue);
  }

  constructor(params: INamedMatrix3Constructor) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'Matrix3',
      ...params,
      name: isData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: Matrix3) => {
        this._value.elements = [...newValue.elements];
      });
    this._value = new Matrix3();
    if (value) {
      this._value.elements = {...value.elements};
      if (isData(value)) this.name = value.name;
    }
  }

  getData(): IDataMatrix3 {
    const e = this.value.elements;
    return {
      name: this.name,
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }
}

export function isNamedMatrix3(value: INamedValue): value is NamedMatrix3 {
  return value.className === 'Matrix3';
}
