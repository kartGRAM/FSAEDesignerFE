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

export interface IComponent {
  readonly className: string;
  readonly name: string;
  readonly col: number;
  setCol(col: number): void;
  readonly degreeOfFreedom: number;
  // 正規化用の拘束式を得る
  getConstraintToNormalize(): Constraint | null;
  applyDq(dq: Matrix): void;
  loadQ(q: number[]): void;
  saveQ(q: number[]): void;
  applyResultToElement(): void;
  position: Vector3;
  quaternion: Quaternion;
  readonly isFixed: boolean;
  getGroupedConstraints(): Constraint[];
  get root(): IComponent;
  get isRoot(): boolean;
  unionFindTreeParent: IComponent;
  unionFindTreeConstraints: Constraint[];
  unite(other: IComponent, constraint: Constraint): void;
  reset(): void;
  saveInitialQ(): void;
  restoreInitialQ(): void;
  saveState(): number[];
  restoreState(state: number[]): void;
}

// 7自由度のコンポーネント
export class FullDegreesComponent implements IComponent {
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

  applyResultToElement() {
    if (this._col === -1) return;
    if (this.degreeOfFreedom === 7) {
      this.element.position.value = this.position;
      this.element.rotation.value = this.quaternion;
    }
  }

  _position: Vector3;

  get position() {
    if (this.isRelativeFixed) return this.parent.position;
    return this._position;
  }

  set position(value: Vector3) {
    if (this.isRelativeFixed) {
      this.parent.position = value;
    }
    this._position = value;
  }

  _quaternion: Quaternion;

  get quaternion() {
    if (this.isRelativeFixed) return this.parent.quaternion;
    return this._quaternion;
  }

  set quaternion(value: Quaternion) {
    if (this.isRelativeFixed) {
      this.parent.quaternion = value;
    }
    this._quaternion = value;
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

  parent = this;

  unionFindTreeParent = this;

  unionFindTreeConstraints: Constraint[] = [];

  getGroupedConstraints() {
    if (!this.isRoot) throw new Error('ルートコンポーネントじゃない');
    return this.unionFindTreeConstraints;
  }

  get root(): IComponent {
    if (this.unionFindTreeParent === this) return this;
    // 経路圧縮
    return this.unionFindTreeParent.root;
  }

  get isRoot(): boolean {
    return this.root === this;
  }

  unite(other: IComponent, constraint: Constraint) {
    if (this.root === other.root) return;
    const otherRoot = other.root;
    other.root.unionFindTreeParent = this.root;
    this.root.unionFindTreeConstraints = [
      ...this.root.unionFindTreeConstraints,
      constraint,
      ...otherRoot.unionFindTreeConstraints
    ];
    otherRoot.unionFindTreeConstraints = [];
  }

  constructor(element: IElement) {
    this.name = element.name.value;
    this.element = element;
    this._position = element.position.value;
    this._quaternion = element.rotation.value;
    this._isFixed = isFixedElement(element); // fixedElementになった場合、ソルバに評価されない
  }

  reset() {
    const {element} = this;
    this._position = element.position.value;
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
      this.position = this._initialPosition.clone();
      this.quaternion = this._initialQuaternion.clone();
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
  component: IComponent
): component is FullDegreesComponent {
  return component.className === FullDegreesComponent.className;
}

// 計算にのみ使用する3自由度の点コンポーネント(bar同士をつなぐ場合のダミー)
export class PointComponent implements IComponent {
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

  // 正規化用の拘束式を得る
  // eslint-disable-next-line class-methods-use-this
  getConstraintToNormalize(): Constraint | null {
    return null;
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

  applyResultToElement() {
    [this.lhs, this.rhs].forEach((p) => {
      const element = p.parent as IElement;
      const pFrom = p.value
        .applyQuaternion(element.rotation.value)
        .add(element.position.value);
      element.position.value = this.position
        .clone()
        .sub(pFrom)
        .add(element.position.value);
    });
  }

  _position: Vector3;

  get position() {
    return this._position;
  }

  set position(value: Vector3) {
    this._position = value;
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

  isRelativeFixed: boolean = false;

  readonly isExcludedComponent = false;

  parent = this;

  unionFindTreeParent = this;

  unionFindTreeConstraints: Constraint[] = [];

  getGroupedConstraints() {
    if (!this.isRoot) throw new Error('ルートコンポーネントじゃない');
    return this.unionFindTreeConstraints;
  }

  get root(): IComponent {
    if (this.unionFindTreeParent === this) return this;
    // 経路圧縮
    return this.unionFindTreeParent.root;
  }

  get isRoot(): boolean {
    return this.root === this;
  }

  unite(other: IComponent, constraint: Constraint) {
    if (this.root === other.root) return;
    const otherRoot = other.root;
    other.root.unionFindTreeParent = this.root;
    this.root.unionFindTreeConstraints = [
      ...this.root.unionFindTreeConstraints,
      constraint,
      ...otherRoot.unionFindTreeConstraints
    ];
    otherRoot.unionFindTreeConstraints = [];
  }

  constructor(lhs: INamedVector3RO, rhs: INamedVector3RO) {
    this.name = `${lhs.name}&${rhs.name}`;
    this.lhs = lhs;
    this.rhs = rhs;
    const element = lhs.parent as IElement;
    this._position = lhs.value
      .applyQuaternion(element.rotation.value)
      .add(element.position.value);
  }

  reset() {
    this._position = this.lhs.value;
  }

  _initialPosition: Vector3 = new Vector3();

  _initialQuaternion: Quaternion = new Quaternion();

  saveInitialQ() {
    this._initialPosition = this.position.clone();
    this._initialQuaternion = this.quaternion.clone();
  }

  restoreInitialQ() {
    if (!this.isRelativeFixed) {
      this.position = this._initialPosition.clone();
      this.quaternion = this._initialQuaternion.clone();
    }
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
