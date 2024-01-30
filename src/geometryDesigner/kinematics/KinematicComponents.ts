/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {IElement} from '@gd/IElements';
import {INamedVector3RO} from '@gd/INamedValues';
import {Vector3, Quaternion} from 'three';
import {isFixedElement} from './KinematicFunctions';
import {Constraint, QuaternionConstraint} from './Constraints';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export interface IVariable {
  readonly className: string;
  readonly name: string;
  readonly col: number;
  setCol(col: number): void;
  readonly degreeOfFreedom: number;
  readonly scale: number; // 長さのスケール（できるだけ長さを-3~3にそろえる）
  applyDq(dq: Matrix): void;
  loadQ(q: number[]): void;
  saveQ(q: number[]): void;
  applyResultToApplication(): void;
  getGroupedConstraints(): Constraint[];
  get root(): IVariable;
  get isRoot(): boolean;
  unionFindTreeParent: IVariable;
  unionFindTreeConstraints: Constraint[];
  unite(other: IVariable): void;
  reset(): void;
  saveInitialQ(): void;
  restoreInitialQ(): void;
  saveState(): number[];
  restoreState(state: number[]): void;
}

export interface IComponent extends IVariable {
  readonly position: Vector3;
  readonly quaternion: Quaternion;
  readonly isFixed: boolean;
}

export abstract class VariableBase implements IVariable {
  abstract readonly className: string;

  abstract readonly name: string;

  abstract setCol(col: number): void;

  abstract get col(): number;

  // 自由度
  abstract get degreeOfFreedom(): number;

  readonly scale: number;

  abstract applyDq(dq: Matrix): void;

  abstract loadQ(q: number[]): void;

  abstract saveQ(q: number[]): void;

  abstract applyResultToApplication(): void;

  unionFindTreeParent = this;

  unionFindTreeConstraints: Constraint[] = [];

  constructor(scale: number) {
    this.scale = scale;
  }

  getGroupedConstraints() {
    if (!this.isRoot) throw new Error('ルートコンポーネントじゃない');
    return this.unionFindTreeConstraints;
  }

  get root(): IVariable {
    if (this.unionFindTreeParent === this) return this;
    // 経路圧縮
    return this.unionFindTreeParent.root;
  }

  get isRoot(): boolean {
    return this.root === this;
  }

  unite(other: IComponent) {
    if (this.root === other.root) {
      return;
    }
    const otherRoot = other.root;
    other.root.unionFindTreeParent = this.root;
    this.root.unionFindTreeConstraints = [
      ...this.root.unionFindTreeConstraints,
      ...otherRoot.unionFindTreeConstraints
    ];
    otherRoot.unionFindTreeConstraints = [];
  }

  abstract reset(): void;

  abstract saveInitialQ(): void;

  abstract restoreInitialQ(): void;

  abstract saveState(): number[];

  abstract restoreState(state: number[]): void;
}

export abstract class ComponentBase extends VariableBase implements IComponent {
  parent = this;

  abstract get position(): Vector3;

  abstract get quaternion(): Quaternion;

  abstract get isFixed(): boolean;
}

// 7自由度のコンポーネント
export class FullDegreesComponent extends ComponentBase {
  static readonly className = 'FullDegreesComponent' as const;

  readonly className = FullDegreesComponent.className;

  readonly name: string;

  // ヤコビアンの列番号
  _col: number = -1;

  setCol(col: number) {
    this._col = col;
  }

  get col(): number {
    if (this.isRelativeFixed) return this.parent.col;
    return this._col;
  }

  // 自由度
  get degreeOfFreedom(): number {
    if (this.isExcludedComponent) return 0;
    return 7;
  }

  // 正規化用の拘束式を得る
  getConstraintToNormalize(): Constraint | null {
    if (this.isExcludedComponent) return null;

    return new QuaternionConstraint('quaternion constraint', this);
  }

  applyDq(dq: Matrix) {
    if (this._col === -1) return;
    const {col} = this;
    if (this.degreeOfFreedom === 7) {
      const dx = dq.get(col + X, 0);
      const dy = dq.get(col + Y, 0);
      const dz = dq.get(col + Z, 0);
      const dq0 = dq.get(col + Q0, 0);
      const dq1 = dq.get(col + Q1, 0);
      const dq2 = dq.get(col + Q2, 0);
      const dq3 = dq.get(col + Q3, 0);
      this._position.x -= dx;
      this._position.y -= dy;
      this._position.z -= dz;
      this._quaternion.w -= dq0;
      this._quaternion.x -= dq1;
      this._quaternion.y -= dq2;
      this._quaternion.z -= dq3;
      this._quaternion.normalize();
    }
  }

  loadQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    if (this.degreeOfFreedom === 7) {
      this.position.x = q[col + X];
      this.position.y = q[col + Y];
      this.position.z = q[col + Z];
      this.quaternion.w = q[col + Q0];
      this.quaternion.x = q[col + Q1];
      this.quaternion.y = q[col + Q2];
      this.quaternion.z = q[col + Q3];
      this._quaternion.normalize();
    }
  }

  saveQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    if (this.degreeOfFreedom === 7) {
      q[col + X] = this.position.x;
      q[col + Y] = this.position.y;
      q[col + Z] = this.position.z;
      q[col + Q0] = this.quaternion.w;
      q[col + Q1] = this.quaternion.x;
      q[col + Q2] = this.quaternion.y;
      q[col + Q3] = this.quaternion.z;
      this._quaternion.normalize();
    }
  }

  element: IElement;

  applyResultToApplication() {
    if (this._col === -1) return;
    if (this.degreeOfFreedom === 7) {
      this.element.position.value = this.position.multiplyScalar(
        1 / this.scale
      );
      this.element.rotation.value = this.quaternion;
    }
  }

  _position: Vector3;

  get position(): Vector3 {
    if (this.isRelativeFixed) return this.parent.position;
    return this._position;
  }

  _quaternion: Quaternion;

  get quaternion(): Quaternion {
    if (this.isRelativeFixed) return this.parent.quaternion;
    return this._quaternion;
  }

  _isFixed: boolean = false;

  get isFixed(): boolean {
    if (this._isFixed) return true;
    if (this.isRelativeFixed) {
      let {parent} = this;
      while (parent.isRelativeFixed) {
        parent = parent.parent;
      }
      if (parent.isFixed) return true;
    }
    return false;
  }

  isRelativeFixed: boolean = false;

  get isExcludedComponent() {
    return this.isFixed || this.isRelativeFixed;
  }

  constructor(element: IElement, scale: number) {
    super(scale);
    this.name = element.name.value;
    this.element = element;
    this._position = element.position.value.multiplyScalar(this.scale);
    this._quaternion = element.rotation.value;
    this._isFixed = isFixedElement(element); // fixedElementになった場合、ソルバに評価されない
  }

  reset() {
    const {element} = this;
    this._position = element.position.value.multiplyScalar(this.scale);
    this._quaternion = element.rotation.value;
    this._isFixed = isFixedElement(element); // fixedElementになった場合、ソルバに評価されない
  }

  _initialPosition: Vector3 = new Vector3();

  _initialQuaternion: Quaternion = new Quaternion();

  saveInitialQ() {
    this._initialPosition = this.position.clone();
    this._initialQuaternion = this.quaternion.clone();
  }

  restoreInitialQ() {
    if (!this.isRelativeFixed) {
      this._position = this._initialPosition.clone();
      this._quaternion = this._initialQuaternion.clone();
    }
  }

  saveState(): number[] {
    const p = this.position;
    const q = this.quaternion;
    return [p.x, p.y, p.z, q.w, q.x, q.y, q.z];
  }

  restoreState(state: number[]): void {
    const p = this.position;
    const q = this.quaternion;
    [p.x, p.y, p.z, q.w, q.x, q.y, q.z] = state;
  }
}

export function isFullDegreesComponent(
  component: IVariable
): component is FullDegreesComponent {
  return component.className === FullDegreesComponent.className;
}

// 計算にのみ使用する3自由度の点コンポーネント(bar同士をつなぐ場合のダミー)
export class PointComponent extends ComponentBase {
  static readonly className = 'PointComponent' as const;

  readonly className = PointComponent.className;

  readonly name: string;

  // ヤコビアンの列番号
  _col: number = -1;

  setCol(col: number) {
    this._col = col;
  }

  get col(): number {
    return this._col;
  }

  // 自由度
  // eslint-disable-next-line class-methods-use-this
  get degreeOfFreedom(): number {
    return 3;
  }

  // とりあえず点の位置だけ合わせる(あとはRestorer任せ)
  applyDq(dq: Matrix) {
    if (this._col === -1) return;
    const {col} = this;
    const dx = dq.get(col + X, 0);
    const dy = dq.get(col + Y, 0);
    const dz = dq.get(col + Z, 0);
    this._position.x -= dx;
    this._position.y -= dy;
    this._position.z -= dz;
  }

  loadQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    this.position.x = q[col + X];
    this.position.y = q[col + Y];
    this.position.z = q[col + Z];
  }

  saveQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    q[col + X] = this.position.x;
    q[col + Y] = this.position.y;
    q[col + Z] = this.position.z;
  }

  lhs: INamedVector3RO;

  rhs: INamedVector3RO;

  applyResultToApplication() {
    [this.lhs, this.rhs].forEach((p) => {
      const element = p.parent as IElement;
      const pFrom = p.value
        .applyQuaternion(element.rotation.value)
        .add(element.position.value);
      element.position.value = this.position
        .clone()
        .multiplyScalar(1 / this.scale)
        .sub(pFrom)
        .add(element.position.value);
    });
  }

  _position: Vector3;

  get position() {
    return this._position;
  }

  get quaternion() {
    return new Quaternion();
  }

  // eslint-disable-next-line no-empty-function
  set quaternion(value: Quaternion) {}

  _isFixed: boolean = false;

  get isFixed(): boolean {
    return false;
  }

  constructor(lhs: INamedVector3RO, rhs: INamedVector3RO, scale: number) {
    super(scale);
    this.name = `${lhs.name}&${rhs.name}`;
    this.lhs = lhs;
    this.rhs = rhs;
    const element = lhs.parent as IElement;
    this._position = lhs.value
      .applyQuaternion(element.rotation.value)
      .add(element.position.value)
      .multiplyScalar(this.scale);
  }

  reset() {
    const {lhs} = this;
    const element = lhs.parent as IElement;
    this._position = lhs.value
      .applyQuaternion(element.rotation.value)
      .add(element.position.value)
      .multiplyScalar(this.scale);
  }

  _initialPosition: Vector3 = new Vector3();

  saveInitialQ() {
    this._initialPosition = this.position.clone();
  }

  restoreInitialQ() {
    this._position = this._initialPosition.clone();
  }

  saveState(): number[] {
    const p = this.position;
    return [p.x, p.y, p.z];
  }

  restoreState(state: number[]): void {
    const p = this.position;
    [p.x, p.y, p.z] = state;
  }
}

export function isPointComponent(
  component: IComponent
): component is PointComponent {
  return component.className === PointComponent.className;
}

export class PointForce extends VariableBase {
  static readonly className = 'PointForce' as const;

  readonly className = PointForce.className;

  readonly name: string;

  // ヤコビアンの列番号
  _col: number = -1;

  setCol(col: number) {
    this._col = col;
  }

  get col(): number {
    return this._col;
  }

  // 自由度(Fx,Fy,Fz)の3自由度
  // eslint-disable-next-line class-methods-use-this
  get degreeOfFreedom(): number {
    return 3;
  }

  applyDq(dq: Matrix) {
    if (this._col === -1) return;
    const {col} = this;
    const dx = dq.get(col + X, 0);
    const dy = dq.get(col + Y, 0);
    const dz = dq.get(col + Z, 0);
    this.force.x -= dx;
    this.force.y -= dy;
    this.force.z -= dz;
  }

  loadQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    this.force.x = q[col + X];
    this.force.y = q[col + Y];
    this.force.z = q[col + Z];
  }

  saveQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    q[col + X] = this.force.x;
    q[col + Y] = this.force.y;
    q[col + Z] = this.force.z;
  }

  lhs: string;

  rhs: string;

  applyResultToApplication() {}

  force: Vector3;

  sign(localVectorNodeID: string): number {
    if (localVectorNodeID === this.lhs) {
      return 1;
    }
    if (localVectorNodeID === this.rhs) {
      return -1;
    }
    throw new Error('NodeIDが一致しない');
  }

  constructor(lhs: INamedVector3RO, rhs: INamedVector3RO, scale: number) {
    super(scale);
    this.name = `${lhs.name}&${rhs.name}`;
    this.lhs = lhs.nodeID;
    this.rhs = rhs.nodeID;
    this.force = new Vector3(0, 0, 0);
  }

  reset() {
    this.force = new Vector3(0, 0, 0);
  }

  _initialForce: Vector3 = new Vector3();

  saveInitialQ() {
    this._initialForce = this.force.clone();
  }

  restoreInitialQ() {
    this.force = this._initialForce.clone();
  }

  saveState(): number[] {
    const p = this.force;
    return [p.x, p.y, p.z];
  }

  restoreState(state: number[]): void {
    const p = this.force;
    [p.x, p.y, p.z] = state;
  }
}

// 例えば変数を追加しない場合、場合、駆動力をぴったり合わせない限り、駆動力分のつり合いが取れないため、
// 結果が収束しなくなる。駆動輪に、駆動力配分に従って、追加の駆動力があるものとして計算する。
// その際駆動力分横力は減らないものとする。スリップ率を収束計算し、最終的にこの項が0に漸近するようにする。
export class GeneralVariable extends VariableBase {
  static readonly className = 'GeneralVariable' as const;

  readonly className = GeneralVariable.className;

  readonly name: string;

  // ヤコビアンの列番号
  _col: number = -1;

  setCol(col: number) {
    this._col = col;
  }

  get col(): number {
    return this._col;
  }

  get degreeOfFreedom(): number {
    return 1;
  }

  applyDq(dq: Matrix) {
    if (this._col === -1) return;
    const {col} = this;
    const dx = dq.get(col + X, 0);
    this.value -= dx;
    // this.value = 0
  }

  loadQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    this.value = q[col + X];
  }

  saveQ(q: number[]) {
    if (this._col === -1) return;
    const {col} = this;
    q[col + X] = this.value;
  }

  applyResultToApplication() {}

  value: number;

  constructor(name: string, scale: number) {
    super(scale);
    this.name = name;
    this.value = 0;
  }

  reset() {
    this.value = 0;
  }

  _initialForce = 0;

  saveInitialQ() {
    this._initialForce = this.value;
  }

  restoreInitialQ() {
    this.value = this._initialForce;
  }

  saveState(): number[] {
    const p = this.value;
    return [p];
  }

  restoreState(state: number[]): void {
    [this.value] = state;
  }
}
