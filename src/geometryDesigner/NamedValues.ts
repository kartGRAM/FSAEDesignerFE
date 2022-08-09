/* eslint-disable max-classes-per-file */
import {Vector3, Matrix3} from 'three';
import {IElement} from '@gd/IElements';
import {Assembly, getDummyElement} from '@gd/Elements';
import {v1 as uuidv1} from 'uuid';
import {Formula} from '@gd/Formula';
import {IDataFormula} from '@gd/IFormula';
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
  INamedMatrix3,
  IPointOffsetTool,
  IDataPointOffsetTool
} from '@gd/IDataValues';
import {GDState} from '@store/reducers/dataGeometryDesigner';

export const isVector3 = (value: any): value is Vector3 => {
  try {
    return value.isVector3;
  } catch (e: any) {
    return false;
  }
};

export const getMatrix3 = (data: IDataMatrix3): Matrix3 => {
  const tmp = new Matrix3();
  tmp.elements = [...data.elements];
  return tmp;
};

export const getVector3 = (data: IDataVector3): Vector3 => {
  const v = new NamedVector3({
    name: 'temp',
    parent: new Assembly({
      name: 'temp',
      children: [],
      joints: []
    }),
    value: data
  });

  return v.value;
};

export const getDataVector3 = (value: Vector3): IDataVector3 => {
  return {
    name: 'temporaryValue',
    x: {name: 'x', value: value.x},
    y: {name: 'y', value: value.y},
    z: {name: 'z', value: value.z}
  };
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
    if (!this.parent) return 'undefined';
    return `${this.nodeID}@${this.parent.absPath}`;
  }

  abstract get value(): unknown;

  abstract set value(newValue: unknown);

  abstract getData(state: GDState): unknown;

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getData(state: GDState): IData<T> {
    return {
      name: this.name,
      value: this.value
    };
  }
}

function isNumber(value: any): value is number {
  // eslint-disable-next-line radix, no-restricted-globals
  const ret = value !== null && isFinite(value);

  return ret;
}

function formulaOrUndef(
  value: string | number,
  name: string,
  absPath: string
): Formula | undefined {
  if (isNumber(value)) return undefined;
  return new Formula({
    name,
    formula: value,
    absPath
  });
}

export class NamedNumber extends NamedValue implements INamedNumber {
  _value: number;

  formula: Formula | undefined;

  private _update: (valueOrFOrmula: string | number) => void;

  get value(): number {
    if (this.formula) {
      return this.formula.evaluatedValue;
    }
    return this._value;
  }

  set value(newValue: number) {
    this._update(newValue);
  }

  setValue(newValue: string | number) {
    this._update(newValue);
  }

  getStringValue(): string {
    return this.formula ? this.formula.formula : this.value.toString();
  }

  getValueWithFormula(formulae: IDataFormula[]): number {
    if (this.formula) {
      return this.formula.getEvaluatedValue(formulae);
    }
    return this._value;
  }

  constructor(params: {
    name: string;
    value: string | number | IDataNumber;
    update?: (valueOrFormula: string | number) => void;
    parent: IElement;
  }) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'number',
      ...params,
      name: isData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: string | number) => {
        this.formula = formulaOrUndef(newValue, this.name, this.absPath);
        this._value = this.formula
          ? this.formula.evaluatedValue
          : Number(newValue as number);
      });
    if (isData(value)) {
      this._value = Number(value.value);
      this.formula = value.formula ? new Formula(value.formula) : undefined;
    } else {
      this.formula = formulaOrUndef(value, this.name, this.absPath);
      this._value = this.formula
        ? this.formula.evaluatedValue
        : Number(value as number);
    }
  }

  getData(state: GDState): IDataNumber {
    return {
      name: this.name,
      value: this.getValueWithFormula(state.formulae),
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

type FVector3 = {
  x: number | string;
  y: number | string;
  z: number | string;
};

interface INamedVector3Constructor {
  name: string;
  parent: IElement;
  value?: FVector3 | IDataVector3;
  update?: (newValue: FVector3) => this;
}

export class NamedVector3 extends NamedValue implements INamedVector3 {
  x: NamedNumber;

  y: NamedNumber;

  z: NamedNumber;

  pointOffsetTools: IPointOffsetTool[] = [];

  private _update: (newValue: FVector3) => void;

  get value(): Vector3 {
    const org = this.originalValue;
    this.pointOffsetTools.forEach((tool) => {
      const {dx, dy, dz} = tool.getOffsetVector();
      org.add(new Vector3(dx, dy, dz));
    });
    return org;
  }

  set value(newValue: Vector3) {
    this._update(newValue);
  }

  get originalValue(): Vector3 {
    return new Vector3(this.x.value, this.y.value, this.z.value);
  }

  setStringValue(newValue: FVector3) {
    this._update(newValue);
  }

  getStringValue(): {x: string; y: string; z: string} {
    return {
      x: this.x.formula ? this.x.formula.formula : this.x.value.toString(),
      y: this.y.formula ? this.y.formula.formula : this.y.value.toString(),
      z: this.z.formula ? this.z.formula.formula : this.z.value.toString()
    };
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
      ((newValue: FVector3) => {
        this.x = new NamedNumber({
          name: `${this.name}_X`,
          value: newValue.x,
          parent: this.parent
        });
        this.y = new NamedNumber({
          name: `${this.name}_Y`,
          value: newValue.y,
          parent: this.parent
        });
        this.z = new NamedNumber({
          name: `${this.name}_Z`,
          value: newValue.z,
          parent: this.parent
        });
      });
    this.x = new NamedNumber({
      name: `${this.name}_X`,
      value: 0,
      parent: this.parent
    });
    this.y = new NamedNumber({
      name: `${this.name}_Y`,
      value: 0,
      parent: this.parent
    });
    this.z = new NamedNumber({
      name: `${this.name}_Z`,
      value: 0,
      parent: this.parent
    });
    if (value) {
      if (isData(value)) {
        this.x = new NamedNumber({
          name: `${this.name}_X`,
          value: value.x,
          parent: this.parent
        });
        this.y = new NamedNumber({
          name: `${this.name}_Y`,
          value: value.y,
          parent: this.parent
        });
        this.z = new NamedNumber({
          name: `${this.name}_Z`,
          value: value.z,
          parent: this.parent
        });
        if (value.pointOffsetTools) {
          this.pointOffsetTools = value.pointOffsetTools.map((tool) =>
            getPointOffsetTool(tool, this)
          );
        }
      } else {
        this._update(value);
      }
    }
  }

  getData(state: GDState): IDataVector3 {
    return {
      name: this.name,
      x: this.x.getData(state),
      y: this.y.getData(state),
      z: this.z.getData(state),
      pointOffsetTools: this.pointOffsetTools?.map((tool) =>
        tool.getData(state)
      )
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

export function getDummyVector3() {
  return new NamedVector3({
    name: 'temp',
    parent: getDummyElement(),
    value: {x: 0, y: 0, z: 0}
  });
}

export function getPointOffsetTool(
  data: IDataPointOffsetTool,
  parent?: INamedVector3
): IPointOffsetTool {
  const parentVector: INamedVector3 = parent ?? getDummyVector3();
  if (isDataDeltaXYZ(data)) {
    return new DeltaXYZ({value: data, parent: parentVector});
  }
  if (isDataDirectionLength(data)) {
    return new DirectionLength({value: data, parent: parentVector});
  }
  throw Error('Not Supported Exception');
}

export const listPointOffsetTools = ['DeltaXYZ', 'DirectionLength'] as const;

function getPOTName(
  name: string,
  parent: INamedVector3,
  value: number | string | IDataNumber,
  valueName: string
) {
  return new NamedNumber({
    name: isData(value)
      ? name
      : `pointOffsetTool_${name}_${valueName}_${parent.name}`,
    value,
    parent: parent.parent
  });
}

export interface IDataDeltaXYZ extends IDataPointOffsetTool {
  dx: IDataNumber;
  dy: IDataNumber;
  dz: IDataNumber;
  className: 'IDataDeltaXYZ';
}

export function isDataDeltaXYZ(data: any): data is IDataDeltaXYZ {
  try {
    return data.className === 'IDataDeltaXYZ';
  } catch (e: any) {
    return false;
  }
}

export function isDeltaXYZ(tool: IPointOffsetTool): tool is DeltaXYZ {
  return tool.className === 'DeltaXYZ';
}

export class DeltaXYZ implements IPointOffsetTool {
  isPointOffsetTool = true as const;

  className = 'DeltaXYZ' as const;

  name: string;

  parent: INamedVector3;

  dx: NamedNumber;

  dy: NamedNumber;

  dz: NamedNumber;

  constructor(props: {
    value:
      | {
          name: string;
          dx: number | string;
          dy: number | string;
          dz: number | string;
        }
      | IDataDeltaXYZ;
    parent: INamedVector3;
  }) {
    const {value, parent} = props;
    const {name, dx, dy, dz} = value;
    this.name = name;
    this.parent = parent;
    this.dx = getPOTName(name, parent, dx, 'dx');
    this.dy = getPOTName(name, parent, dy, 'dy');
    this.dz = getPOTName(name, parent, dz, 'dz');
  }

  getOffsetVector(): {dx: number; dy: number; dz: number} {
    return {
      dx: this.dx.value,
      dy: this.dy.value,
      dz: this.dz.value
    };
  }

  getData(state: GDState): IDataDeltaXYZ {
    return {
      name: this.name,
      isDataPointOffsetTool: true,
      className: 'IDataDeltaXYZ',
      dx: this.dx.getData(state),
      dy: this.dy.getData(state),
      dz: this.dz.getData(state)
    };
  }

  getStringValue(): {dx: string; dy: string; dz: string} {
    return {
      dx: this.dx.formula ? this.dx.formula.formula : this.dx.value.toString(),
      dy: this.dy.formula ? this.dy.formula.formula : this.dy.value.toString(),
      dz: this.dz.formula ? this.dz.formula.formula : this.dz.value.toString()
    };
  }
}

export interface IDataDirectionLength extends IDataPointOffsetTool {
  nx: IDataNumber;
  ny: IDataNumber;
  nz: IDataNumber;
  l: IDataNumber;
  className: 'IDataDirectionLength';
}

export function isDataDirectionLength(
  data: IDataPointOffsetTool
): data is IDataDirectionLength {
  try {
    return data.className === 'IDataDirectionLength';
  } catch (e: any) {
    return false;
  }
}

export function isDirectionLength(
  tool: IPointOffsetTool
): tool is DirectionLength {
  return tool.className === 'DirectionLength';
}

export class DirectionLength implements IPointOffsetTool {
  isPointOffsetTool = true as const;

  className = 'DirectionLength' as const;

  name: string;

  parent: INamedVector3;

  nx: NamedNumber;

  ny: NamedNumber;

  nz: NamedNumber;

  l: NamedNumber;

  constructor(props: {
    value:
      | {
          name: string;
          nx: number | string;
          ny: number | string;
          nz: number | string;
          l: number | string;
        }
      | IDataDirectionLength;
    parent: INamedVector3;
  }) {
    const {value, parent} = props;
    const {name, nx, ny, nz, l} = value;
    this.name = name;
    this.parent = parent;
    this.nx = getPOTName(name, parent, nx, 'nx');
    this.ny = getPOTName(name, parent, ny, 'ny');
    this.nz = getPOTName(name, parent, nz, 'nz');
    this.l = getPOTName(name, parent, l, 'l');
  }

  getOffsetVector(): {dx: number; dy: number; dz: number} {
    const nx = this.nx.value;
    const ny = this.ny.value;
    const nz = this.nz.value;
    const l = this.l.value;
    const norm = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return {
      dx: (nx * l) / norm,
      dy: (ny * l) / norm,
      dz: (nz * l) / norm
    };
  }

  getData(state: GDState): IDataDirectionLength {
    return {
      name: this.name,
      isDataPointOffsetTool: true,
      className: 'IDataDirectionLength',
      nx: this.nx.getData(state),
      ny: this.ny.getData(state),
      nz: this.nz.getData(state),
      l: this.l.getData(state)
    };
  }

  getStringValue(): {nx: string; ny: string; nz: string; l: string} {
    return {
      nx: this.nx.formula ? this.nx.formula.formula : this.nx.value.toString(),
      ny: this.ny.formula ? this.ny.formula.formula : this.ny.value.toString(),
      nz: this.nz.formula ? this.nz.formula.formula : this.nz.value.toString(),
      l: this.l.formula ? this.l.formula.formula : this.l.value.toString()
    };
  }
}
