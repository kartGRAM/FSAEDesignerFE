/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IScalar} from '@computationGraph/IScalar';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {getStableOrthogonalVector} from '../KinematicFunctions';
import {IComponent, FullDegreesComponent} from '../KinematicComponents';
import {Sphere} from '../KinematicConstraints/Sphere';
import {deltaL} from '../KinematicConstraints';

export class LinearBushingSingleEnd implements Constraint, deltaL {
  readonly className = 'LinearBushingSingleEnd';

  // 自由度を2減らす
  constraints(options: ConstraintsOptions) {
    const {fixLinearBushing} = options;
    // 組み立て時は固定する
    if (fixLinearBushing) return 3;
    if (this.controled) return 3;
    return 2;
  }

  active() {
    return true;
  }

  readonly isInequalityConstraint = false;

  resetStates(): void {
    this._dl = 0;
  }

  readonly controledBy: string[];

  get controled() {
    return this.controledBy.length > 0;
  }

  row: number = -1;

  res: IComponent;

  fixed: IComponent;

  relevantVariables: IComponent[];

  initialLength: number;

  hasDl = true as const;

  _dl: number = 0;

  set dl(value: number) {
    this._dl = Math.min(
      this.dlMax,
      Math.max(this.dlMin, value * this.fixed.scale)
    );
  }

  get dl(): number {
    return this._dl / this.fixed.scale;
  }

  elementID: string;

  name: string;

  dlMin: number = Number.MIN_SAFE_INTEGER;

  dlMax: number = Number.MAX_SAFE_INTEGER;

  sphere: Sphere;

  pFixed: VariableVector3;

  qFixed: VariableQuaternion;

  pRes: VariableVector3;

  qRes: VariableQuaternion;

  error: IScalar[];

  centerValue: Vector3;

  fixedAxisVecValue: Vector3;

  constructor(
    name: string,
    cFixed: FullDegreesComponent,
    cRodEndSide: IComponent,
    vFixed: [Vector3, Vector3],
    initialLength: number,
    controledBy: string[],
    vRodEndSide?: Vector3,
    dlMin?: number,
    dlMax?: number,
    elementID?: string
  ) {
    this.controledBy = controledBy;
    this.elementID = elementID ?? '';
    this.initialLength = initialLength * cFixed.scale;
    this.fixed = cFixed;
    this.res = cRodEndSide;

    this.relevantVariables = [cFixed, cRodEndSide];
    const fixedLocalVec = [
      new ConstantVector3(vFixed[0].clone().multiplyScalar(cFixed.scale)),
      new ConstantVector3(vFixed[1].clone().multiplyScalar(cFixed.scale))
    ];
    const center = fixedLocalVec[1].add(fixedLocalVec[0]).mul(0.5);
    this.centerValue = center.vector3Value;
    const fixedAxisVec = fixedLocalVec[1].sub(fixedLocalVec[0]);
    this.fixedAxisVecValue = fixedAxisVec.vector3Value;
    if (this.fixedAxisVecValue.lengthSq() < Number.EPSILON) {
      throw new Error('リニアブッシュを保持するする2点が近すぎます');
    }
    const vRE = vRodEndSide?.clone().multiplyScalar(cRodEndSide.scale);

    this.name = name;
    if (dlMin) this.dlMin = dlMin * cFixed.scale;
    if (dlMax) this.dlMax = dlMax * cFixed.scale;
    if (cRodEndSide.isFixed) {
      throw new Error('RodEnd側が固定されている');
    }

    const resLocalVec = new ConstantVector3(vRE?.clone() ?? new Vector3());

    const oVec1 = getStableOrthogonalVector(this.fixedAxisVecValue);
    const oVec2 = this.fixedAxisVecValue.clone().cross(oVec1).normalize();
    const fixedOrthogonalVec = [
      new ConstantVector3(oVec1),
      new ConstantVector3(oVec2)
    ];

    this.pFixed = cFixed.positionVariable;
    this.qFixed = cFixed.quaternionVariable;
    this.pRes = cRodEndSide.positionVariable;
    this.qRes = cRodEndSide.quaternionVariable;
    const AFixed = this.qFixed.getRotationMatrix();
    const ARes = this.qRes.getRotationMatrix();
    const sFixed = fixedLocalVec.map((localVec) => AFixed.vmul(localVec));

    const axis = this.pRes
      .add(ARes.vmul(resLocalVec))
      .sub(sFixed[0].add(this.pFixed));

    this.error = fixedOrthogonalVec.map((v) => {
      const orthoVec = AFixed.vmul(v);
      return orthoVec.dot(axis);
    });

    this.sphere = new Sphere(
      name,
      this.fixed,
      this.res,
      this.centerValue
        .clone()
        .multiplyScalar(1 / cFixed.scale)
        .add(
          fixedAxisVec.vector3Value
            .clone()
            .normalize()
            .multiplyScalar(this.initialLength / cFixed.scale)
        ),
      vRE
    );
  }

  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ) {
    const {fixLinearBushing} = options;
    if (this.controled) {
      this.sphere.row = this.row;
      this.sphere.setVlhs(
        this.centerValue.clone().add(
          this.fixedAxisVecValue
            .clone()
            .normalize()
            .multiplyScalar(this.initialLength + this._dl)
        )
      );
      this.sphere.setJacobianAndConstraints(phi_q, phi);
      return;
    }
    if (fixLinearBushing) {
      this.sphere.row = this.row;
      this.sphere.setVlhs(
        this.centerValue
          .clone()
          .add(
            this.fixedAxisVecValue
              .clone()
              .normalize()
              .multiplyScalar(this.initialLength)
          )
      );
      this.sphere.setJacobianAndConstraints(phi_q, phi);
      return;
    }

    const {row} = this;

    this.pFixed.setValue(this.fixed.position);
    this.pRes.setValue(this.res.position);
    this.qFixed.setValue(this.fixed.quaternion);
    this.qRes.setValue(this.res.quaternion);

    let resetKey = -1;
    this.error.forEach((error, i) => {
      resetKey = error.reset({variablesOnly: false, resetKey});
      phi[row + i] = error.scalarValue;
      error.diff(Matrix.eye(1, 1));
      error.setJacobian(phi_q, row + i);
    });
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isLinearBushingSingleEnd(
  constraint: Constraint
): constraint is LinearBushingSingleEnd {
  return constraint.className === 'LinearBushingSingleEnd';
}
