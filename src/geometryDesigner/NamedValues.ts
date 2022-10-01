/* eslint-disable max-classes-per-file */
import {Vector3, Matrix3, Quaternion} from 'three';
import {IBidirectionalNode, INode} from '@gd/INode';
import {Assembly, getDummyElement} from '@gd/Elements';
import {v4 as uuidv4} from 'uuid';
import {Formula} from '@gd/Formula';
import {IDataFormula, IFormula} from '@gd/IFormula';
import {
  isNamedData,
  isNamedValue,
  isNamedVector3,
  // isNamedNumber,
  isDataPointOffsetTool,
  IDataVector3,
  IDataMatrix3,
  IDataQuaternion,
  IDataNumber,
  IData,
  INamedValue,
  INamedNumber,
  INamedString,
  INamedBoolean,
  INamedBooleanOrUndefined,
  INamedVector3,
  INamedMatrix3,
  INamedQuaternion,
  IPointOffsetTool,
  IDataPointOffsetTool,
  FunctionVector3
  // isNamedVector3
} from '@gd/INamedValues';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {capitalize} from '@app/utils/helpers';

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
    className: 'NamedVector3',
    absPath: 'temporaryPath',
    nodeID: '',
    isNamedData: true,
    x: {
      name: 'x',
      value: {name: 'x', absPath: 'temporaryPath', formula: value.x.toString()},
      absPath: 'temporaryPath',
      nodeID: '',
      className: 'NamedNumber',
      isNamedData: true
    },
    y: {
      name: 'y',
      value: {name: 'y', absPath: 'temporaryPath', formula: value.y.toString()},
      absPath: 'temporaryPath',
      nodeID: '',
      className: 'NamedNumber',
      isNamedData: true
    },
    z: {
      name: 'z',
      value: {name: 'z', absPath: 'temporaryPath', formula: value.z.toString()},
      absPath: 'temporaryPath',
      nodeID: '',
      className: 'NamedNumber',
      isNamedData: true
    }
  };
};

abstract class NamedValue implements INamedValue {
  readonly isNamedValue = true as const;

  readonly className: string;

  parent: IBidirectionalNode | null;

  readonly nodeID: string;

  name: string;

  getName(): string {
    return this.name;
  }

  getNamedAbsPath(): string {
    return `${this.getName()}${
      this.parent ? `@${this.parent.getNamedAbsPath()}` : ''
    }`;
  }

  get absPath(): string {
    return `${this.nodeID}${this.parent ? `@${this.parent.absPath}` : ''}`;
  }

  abstract get value(): unknown;

  abstract set value(newValue: unknown);

  abstract getData(state: GDState): unknown;

  getDataBase() {
    return {
      isNamedData: true as const,
      className: this.className,
      name: this.name,
      absPath: this.absPath,
      nodeID: this.nodeID
    };
  }

  constructor(params: {
    parent?: IBidirectionalNode;
    name: string;
    className: string;
    value?: INode | unknown;
    nodeID?: string;
  }) {
    const {className, parent, name, value, nodeID} = params;
    this.className = className;
    this.parent = parent ?? null;
    this.name = name;
    if (value && isNamedData(value)) {
      this.nodeID = value.nodeID;
    } else {
      this.nodeID = uuidv4();
    }
    if (nodeID) this.nodeID = nodeID;
  }
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

  constructor(params: {
    name: string;
    value: T | IData<T>;
    update?: (newValue: T) => void;
    parent?: IBidirectionalNode;
  }) {
    const {name: defaultName, value, update} = params;
    super({
      className: `Named${capitalize(typeof value)}`,
      ...params,
      name: isNamedData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: T) => {
        this._value = newValue;
      });
    this._value = isNamedData(value) ? value.value : value;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getData(state: GDState): IData<T> {
    return {
      ...super.getDataBase(),
      value: this.value
    };
  }
}

export class NamedNumber extends NamedValue implements INamedNumber {
  formula: IFormula;

  private _update: (valueOrFOrmula: string | number | INamedNumber) => void;

  get value(): number {
    return this.formula.evaluatedValue;
  }

  set value(newValue: number) {
    this._update(newValue);
  }

  setValue(newValue: string | number | INamedNumber): INamedNumber {
    this._update(newValue);
    return this;
  }

  getStringValue(): string {
    return this.formula ? this.formula.formula : this.value.toString();
  }

  getValueWithFormula(formulae: IDataFormula[]): number {
    return this.formula.getEvaluatedValue(formulae);
  }

  constructor(params: {
    name?: string;
    value: string | number | IDataNumber | INamedNumber;
    update?: (valueOrFormula: string | number | INamedNumber) => void;
    parent?: IBidirectionalNode;
  }) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'NamedNumber',
      ...params,
      name:
        isNamedData(value) || isNamedValue(value)
          ? value.name
          : defaultName ?? 'temporary'
    });
    this._update =
      update ??
      ((newValue: string | number | INamedNumber) => {
        // eslint-disable-next-line no-nested-ternary
        if (isNamedValue(newValue)) {
          this.formula.formula = newValue.formula.formula;
        } else {
          this.formula.formula = newValue.toString();
        }
      });
    if (isNamedData(value)) {
      this.formula = new Formula(value.value);
    } else if (isNamedValue(value)) {
      this.formula = value.formula.copy(this.absPath);
    } else {
      this.formula = new Formula({
        name: this.name,
        formula: value,
        absPath: this.absPath
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getData(state: GDState): IDataNumber {
    return {
      ...super.getDataBase(),
      value: this.formula.getData()
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
  return value.className === 'NamedString';
}

export function isNamedBoolean(value: INamedValue): value is NamedBoolean {
  return value.className === 'NamedBoolean';
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

  constructor(params: {
    name: string;
    value: boolean | undefined | IData<boolean | undefined>;
    update?: (newValue: boolean | undefined) => void;
    parent?: IBidirectionalNode;
  }) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'NamedBooleanOrUndefined',
      ...params,
      name: isNamedData(value) ? value.name : defaultName
    });
    this._update =
      update ??
      ((newValue: boolean | undefined) => {
        this._value = newValue;
      });
    this._value = isNamedData(value) ? value.value : value;
  }

  getData(): IData<boolean | undefined> {
    return {
      ...super.getDataBase(),
      value: this.value
    };
  }
}

export function isNamedBooleanOrUndefined(
  value: INamedValue
): value is NamedBooleanOrUndefined {
  return value.className === 'NamedBooleanOrUndefined';
}

export class NamedVector3 extends NamedValue implements INamedVector3 {
  readonly x: NamedNumber;

  readonly y: NamedNumber;

  readonly z: NamedNumber;

  mirrorTo: string | undefined;

  pointOffsetTools: IPointOffsetTool[] = [];

  private _update: (newValue: FunctionVector3 | INamedVector3) => void;

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

  setValue(newValue: FunctionVector3 | INamedVector3): INamedVector3 {
    this._update(newValue);
    return this;
  }

  getStringValue(): {x: string; y: string; z: string} {
    return {
      x: this.x.formula ? this.x.formula.formula : this.x.value.toString(),
      y: this.y.formula ? this.y.formula.formula : this.y.value.toString(),
      z: this.z.formula ? this.z.formula.formula : this.z.value.toString()
    };
  }

  constructor(params: {
    name?: string;
    parent?: IBidirectionalNode;
    value?: FunctionVector3 | IDataVector3 | INamedVector3;
    update?: (newValue: FunctionVector3 | INamedVector3) => void;
    nodeID?: string;
  }) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'NamedVector3',
      ...params,
      name:
        isNamedData(value) || isNamedValue(value)
          ? value.name
          : defaultName ?? 'temporary'
    });
    this._update =
      update ??
      ((newValue: FunctionVector3 | INamedVector3) => {
        this.x.setValue(newValue.x);
        this.y.setValue(newValue.y);
        this.z.setValue(newValue.z);
        if (isNamedVector3(newValue)) {
          this.pointOffsetTools = newValue.pointOffsetTools.map((tool) =>
            tool.copy(this)
          );
        }
      });
    this.x = new NamedNumber({
      name: `${this.name}_X`,
      value: value?.x ?? 0,
      parent: this
    });
    this.y = new NamedNumber({
      name: `${this.name}_Y`,
      value: value?.y ?? 0,
      parent: this
    });
    this.z = new NamedNumber({
      name: `${this.name}_Z`,
      value: value?.z ?? 0,
      parent: this
    });
    if (isNamedData(value)) {
      this.mirrorTo = value.mirrorTo;
      if (value.pointOffsetTools) {
        this.pointOffsetTools = value.pointOffsetTools.map((tool) =>
          getPointOffsetTool(tool, this)
        );
      }
    } else if (isNamedValue(value)) {
      this.mirrorTo = value.mirrorTo;
      if (value.pointOffsetTools) {
        this.pointOffsetTools = value.pointOffsetTools.map((tool) =>
          tool.copy(this)
        );
      }
    }
  }

  getData(state: GDState): IDataVector3 {
    return {
      ...super.getDataBase(),
      x: this.x.getData(state),
      y: this.y.getData(state),
      z: this.z.getData(state),
      pointOffsetTools: this.pointOffsetTools?.map((tool) =>
        tool.getData(state)
      ),
      mirrorTo: this.mirrorTo
    };
  }
}

export function getDummyVector3() {
  return new NamedVector3({
    name: 'temp',
    parent: getDummyElement(),
    value: {x: 0, y: 0, z: 0}
  });
}

export class NamedMatrix3 extends NamedValue implements INamedMatrix3 {
  private _update: (newValue: Matrix3 | INamedMatrix3) => void;

  _value: Matrix3;

  get value(): Matrix3 {
    return this._value;
  }

  set value(newValue: Matrix3) {
    this._update(newValue);
  }

  constructor(params: {
    name?: string;
    parent?: IBidirectionalNode;
    value?: IDataMatrix3 | Matrix3 | INamedMatrix3;
    update?: (newValue: Matrix3 | INamedMatrix3) => void;
  }) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'Matrix3',
      ...params,
      name:
        isNamedData(value) || isNamedValue(value)
          ? value.name
          : defaultName ?? 'temporary'
    });
    this._update =
      update ??
      ((newValue: Matrix3 | INamedMatrix3) => {
        if (isNamedValue(newValue)) {
          this._value.elements = [...newValue.value.elements];
        } else {
          this._value.elements = [...newValue.elements];
        }
      });

    this._value = new Matrix3();
    if (isNamedValue(value)) {
      this._value.elements = {...value.value.elements};
    } else if (value) {
      this._value.elements = {...value.elements};
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getData(state: GDState): IDataMatrix3 {
    const e = this.value.elements;
    return {
      ...super.getDataBase(),
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }
}

export class NamedQuaternion extends NamedValue implements INamedQuaternion {
  private _update: (newValue: Quaternion | INamedQuaternion) => void;

  _value: Quaternion;

  get value(): Quaternion {
    return this._value.clone();
  }

  set value(newValue: Quaternion) {
    this._update(newValue);
  }

  constructor(params: {
    name?: string;
    parent?: IBidirectionalNode;
    value?: IDataQuaternion | Quaternion | INamedQuaternion;
    update?: (newValue: Quaternion | INamedQuaternion) => void;
  }) {
    const {name: defaultName, value, update} = params;
    super({
      className: 'Quaternion',
      ...params,
      name:
        isNamedData(value) || isNamedValue(value)
          ? value.name
          : defaultName ?? 'temporary'
    });
    this._update =
      update ??
      ((newValue: Quaternion | INamedQuaternion) => {
        if (isNamedValue(newValue)) {
          this._value.copy(newValue.value);
        } else {
          this._value.copy(newValue);
        }
      });

    this._value = new Quaternion();
    if (isNamedValue(value)) {
      this._value.copy(value.value);
    } else if (value) {
      this._value.w = value.w;
      this._value.x = value.x;
      this._value.y = value.y;
      this._value.z = value.z;
      this._value.normalize();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getData(state: GDState): IDataQuaternion {
    return {
      ...super.getDataBase(),
      w: this._value.w,
      x: this._value.x,
      y: this._value.y,
      z: this._value.z
    };
  }
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
  parent: IPointOffsetTool,
  value: number | string | IDataNumber | INamedNumber,
  valueName: string
) {
  return new NamedNumber({
    name:
      isNamedData(value) || isNamedValue(value)
        ? value.name
        : `${parent.name}_${valueName}`,
    value,
    parent
  });
}

export interface IDataDeltaXYZ extends IDataPointOffsetTool {
  dx: IDataNumber;
  dy: IDataNumber;
  dz: IDataNumber;
}

export function isDataDeltaXYZ(data: any): data is IDataDeltaXYZ {
  try {
    return data.isDataPointOffsetTool && data.className === 'DeltaXYZ';
  } catch (e: any) {
    return false;
  }
}

export function isDeltaXYZ(tool: IPointOffsetTool): tool is DeltaXYZ {
  return tool.className === 'DeltaXYZ';
}

abstract class PointOffsetTool implements IPointOffsetTool {
  readonly isPointOffsetTool = true as const;

  readonly className: string;

  readonly parent: INamedVector3;

  readonly nodeID: string;

  name: string;

  getName(): string {
    return this.name;
  }

  getNamedAbsPath(): string {
    return `${this.getName()}@${this.parent.getNamedAbsPath()}`;
  }

  get absPath(): string {
    return `${this.nodeID}@${this.parent.absPath}`;
  }

  abstract copy(newParent: INamedVector3): IPointOffsetTool;

  abstract getData(state: GDState): IDataPointOffsetTool;

  abstract getOffsetVector(): {dx: number; dy: number; dz: number};

  getDataBase() {
    return {
      className: this.className,
      isDataPointOffsetTool: true as const,
      name: this.name,
      absPath: this.absPath,
      nodeID: this.nodeID
    };
  }

  constructor(params: {
    value:
      | {
          name: string;
        }
      | IDataPointOffsetTool;
    parent: INamedVector3;
    className: string;
  }) {
    const {className, parent, value} = params;
    const {name} = value;
    this.className = className;
    this.parent = parent;
    this.name = name;

    if (isDataPointOffsetTool(value)) {
      this.nodeID = value.nodeID;
    } else {
      this.nodeID = uuidv4();
    }
  }
}

export class DeltaXYZ extends PointOffsetTool implements IPointOffsetTool {
  dx: NamedNumber;

  dy: NamedNumber;

  dz: NamedNumber;

  constructor(props: {
    value:
      | {
          name: string;
          dx: number | string | INamedNumber;
          dy: number | string | INamedNumber;
          dz: number | string | INamedNumber;
        }
      | IDataDeltaXYZ;
    parent: INamedVector3;
  }) {
    super({
      ...props,
      className: 'DeltaXYZ'
    });
    const {value} = props;
    const {dx, dy, dz} = value;
    this.dx = getPOTName(this, dx, 'dx');
    this.dy = getPOTName(this, dy, 'dy');
    this.dz = getPOTName(this, dz, 'dz');
  }

  getOffsetVector(): {dx: number; dy: number; dz: number} {
    return {
      dx: this.dx.value,
      dy: this.dy.value,
      dz: this.dz.value
    };
  }

  copy(newParent: INamedVector3): DeltaXYZ {
    return new DeltaXYZ({
      value: {name: this.name, dx: this.dx, dy: this.dy, dz: this.dz},
      parent: newParent
    });
  }

  getData(state: GDState): IDataDeltaXYZ {
    return {
      ...super.getDataBase(),
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
}

export function isDataDirectionLength(data: any): data is IDataDirectionLength {
  try {
    return data.isDataPointOffsetTool && data.className === 'DirectionLength';
  } catch (e: any) {
    return false;
  }
}

export function isDirectionLength(
  tool: IPointOffsetTool
): tool is DirectionLength {
  return tool.className === 'DirectionLength';
}

export class DirectionLength
  extends PointOffsetTool
  implements IPointOffsetTool
{
  nx: NamedNumber;

  ny: NamedNumber;

  nz: NamedNumber;

  l: NamedNumber;

  constructor(props: {
    value:
      | {
          name: string;
          nx: number | string | INamedNumber;
          ny: number | string | INamedNumber;
          nz: number | string | INamedNumber;
          l: number | string | INamedNumber;
        }
      | IDataDirectionLength;
    parent: INamedVector3;
  }) {
    super({
      ...props,
      className: 'DirectionLength'
    });

    const {value} = props;
    const {nx, ny, nz, l} = value;
    this.nx = getPOTName(this, nx, 'nx');
    this.ny = getPOTName(this, ny, 'ny');
    this.nz = getPOTName(this, nz, 'nz');
    this.l = getPOTName(this, l, 'l');
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

  copy(newParent: INamedVector3): DirectionLength {
    return new DirectionLength({
      value: {
        name: this.name,
        nx: this.nx,
        ny: this.ny,
        nz: this.nz,
        l: this.l
      },
      parent: newParent
    });
  }

  getData(state: GDState): IDataDirectionLength {
    return {
      ...super.getDataBase(),
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
