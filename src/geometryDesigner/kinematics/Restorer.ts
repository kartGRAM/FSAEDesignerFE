/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {IElement} from '@gd/IElements';
import {IAArm} from '@gd/IElements/IAArm';
import {IBar} from '@gd/IElements/IBar';
import {ITire} from '@gd/IElements/ITire';
import {isSpringDumper} from '@gd/IElements/ISpringDumper';
import {ILinearBushing} from '@gd/IElements/ILinearBushing';
import {ITorsionSpring} from '@gd/IElements/ITorsionSpring';
import {INamedVector3RO} from '@gd/INamedValues';
import {Vector3, Quaternion} from 'three';

export interface Restorer {
  restore(unresolvedPoints: {[key: string]: Vector3}): void;
}

export class BarRestorer implements Restorer {
  element: IBar;

  fixedPoint: INamedVector3RO;

  point: INamedVector3RO;

  constructor(
    element: IBar,
    fixedPoint: INamedVector3RO,
    point: INamedVector3RO
  ) {
    this.element = element;
    this.fixedPoint = fixedPoint;
    this.point = point;
  }

  restore(unresolvedPoints: {[key: string]: Vector3}) {
    const fp = this.element.fixedPoint.value;
    const fpParent = this.fixedPoint.parent as IElement;
    const pParent = this.point.parent as IElement;
    const fpTo =
      unresolvedPoints[this.fixedPoint.nodeID] ??
      this.fixedPoint.value
        .applyQuaternion(fpParent.rotation.value)
        .add(fpParent.position.value);
    const s = this.element.point.value.sub(fp).normalize();

    const pTo =
      unresolvedPoints[this.point.nodeID] ??
      this.point.value
        .applyQuaternion(pParent.rotation.value)
        .add(pParent.position.value);
    const sTo = pTo.clone().sub(fpTo).normalize();
    this.element.rotation.value = new Quaternion().setFromUnitVectors(s, sTo);

    fp.applyQuaternion(this.element.rotation.value).add(
      this.element.position.value
    );
    const deltaP = fpTo.clone().sub(fp);
    this.element.position.value = this.element.position.value.add(deltaP);
    if (isSpringDumper(this.element)) {
      const l = fpTo.sub(pTo).length();
      this.element.dlCurrent = l - this.element.length;
    }
  }
}

export class AArmRestorer implements Restorer {
  element: IAArm;

  fixedPoints: [INamedVector3RO, INamedVector3RO];

  point: INamedVector3RO;

  constructor(
    element: IAArm,
    fixedPoints: [INamedVector3RO, INamedVector3RO],
    point: INamedVector3RO
  ) {
    this.element = element;
    this.fixedPoints = fixedPoints;
    this.point = point;
  }

  restore(unresolvedPoints: {[key: string]: Vector3}) {
    const points = this.element.getPoints().map((fp) => fp.value);
    const fps = points.slice(0, 2);
    const p = points[2];

    const fpTo = this.fixedPoints.map((p) => {
      if (unresolvedPoints[p.nodeID]) return unresolvedPoints[p.nodeID];
      const fpParent = p.parent as IElement;
      return p.value
        .applyQuaternion(fpParent.rotation.value)
        .add(fpParent.position.value);
    });

    const pParent = this.point.parent as IElement;
    const pTo =
      unresolvedPoints[this.point.nodeID] ??
      this.point.value
        .applyQuaternion(pParent.rotation.value)
        .add(pParent.position.value);

    const s = fps[1].clone().sub(fps[0]).normalize();
    const sTo = fpTo[1].clone().sub(fpTo[0]).normalize();
    const rot1 = new Quaternion().setFromUnitVectors(s, sTo);
    points.forEach((p) => p.applyQuaternion(rot1));

    const eTmp = p.clone().sub(fps[0]);
    const eToTmp = pTo.clone().sub(fpTo[0]);
    const e = eTmp
      .clone()
      .sub(sTo.clone().multiplyScalar(sTo.dot(eTmp)))
      .normalize();
    const eTo = eToTmp
      .clone()
      .sub(sTo.clone().multiplyScalar(sTo.dot(eToTmp)))
      .normalize();
    const rot2 = new Quaternion().setFromUnitVectors(e, eTo);
    points.forEach((p) => p.applyQuaternion(rot2));

    this.element.rotation.value = rot2.multiply(rot1);
    // this.element.rotation.value = rot1;

    const deltaP = fpTo[0].clone().sub(fps[0]);
    this.element.position.value = deltaP;
  }
}

export class TireRestorer implements Restorer {
  element: ITire;

  outerBearing: INamedVector3RO;

  innerBearing: INamedVector3RO;

  constructor(
    element: ITire,
    outerBearing: INamedVector3RO,
    innerBearing: INamedVector3RO
  ) {
    this.element = element;
    this.outerBearing = outerBearing;
    this.innerBearing = innerBearing;
  }

  static getTireLocalPosition(
    tireLeftBearing: Vector3,
    tireRightBearing: Vector3,
    targetLeftBearing: Vector3,
    targetRightBearing: Vector3
  ): {position: Vector3; rotation: Quaternion} {
    const fp = tireLeftBearing.clone();
    const p = tireRightBearing.clone();
    const fpTo = targetLeftBearing.clone();
    const pTo = targetRightBearing.clone();
    const s = p.sub(fp).normalize();
    const sTo = pTo.sub(fpTo).normalize();
    const rotation = new Quaternion().setFromUnitVectors(s, sTo);

    const position = fpTo.sub(fp.applyQuaternion(rotation));

    return {position, rotation};
  }

  restore() {
    const fpParent = this.outerBearing.parent as IElement;
    const fpTo = this.outerBearing.value
      .applyQuaternion(fpParent.rotation.value)
      .add(fpParent.position.value);

    const pParent = this.innerBearing.parent as IElement;
    const pTo = this.innerBearing.value
      .applyQuaternion(pParent.rotation.value)
      .add(pParent.position.value);

    const {position, rotation} = TireRestorer.getTireLocalPosition(
      this.element.outerBearing.value,
      this.element.innerBearing.value,
      fpTo,
      pTo
    );

    this.element.rotation.value = rotation;
    this.element.position.value = position;
  }
}

export class RelativeConstraintRestorer implements Restorer {
  constrained: IElement;

  componentElement: IElement;

  deltaPosition: Vector3;

  deltaQuaternion: Quaternion;

  constructor(constrained: IElement, componentElement: IElement) {
    this.constrained = constrained;
    this.componentElement = componentElement;
    this.deltaPosition = new Vector3();
    this.deltaQuaternion = new Quaternion();
    throw new Error('未実装');
  }

  restore() {}
}

export class LinearBushingRestorer implements Restorer {
  element: ILinearBushing;

  fixedPoints: INamedVector3RO[];

  point: INamedVector3RO;

  constructor(
    element: ILinearBushing,
    fixedPoints: [INamedVector3RO, INamedVector3RO],
    point: INamedVector3RO
  ) {
    this.element = element;
    this.fixedPoints = fixedPoints;
    this.point = point;
  }

  restore(unresolvedPoints: {[key: string]: Vector3}) {
    const fps = this.element.fixedPoints.map((p) => p.value);
    const fpParent = this.fixedPoints[0].parent as IElement;

    const fpsTo = this.fixedPoints.map(
      (p) =>
        unresolvedPoints[p.nodeID] ??
        p.value
          .applyQuaternion(fpParent.rotation.value)
          .add(fpParent.position.value)
    );
    const s = fps[1].clone().sub(fps[0]).normalize();
    const sTo = fpsTo[1].clone().sub(fpsTo[0]).normalize();
    this.element.rotation.value = new Quaternion().setFromUnitVectors(s, sTo);

    fps.forEach((p) =>
      p
        .applyQuaternion(this.element.rotation.value)
        .add(this.element.position.value)
    );
    const deltaP = fpsTo[0].clone().sub(fps[0]);
    this.element.position.value = this.element.position.value.add(deltaP);

    const supportsCenter = fpsTo[1].clone().add(fpsTo[0]).multiplyScalar(0.5);
    const pParent = this.point.parent as IElement;

    const pTo =
      unresolvedPoints[this.point.nodeID] ??
      this.point.value
        .applyQuaternion(pParent.rotation.value)
        .add(pParent.position.value);
    const pToDelta = pTo.sub(supportsCenter);
    const sign = pToDelta.dot(sTo) > 0 ? 1 : -1;
    const initialPosition = this.element.toPoints[0].value;
    this.element.dlCurrent = pToDelta.length() * sign - initialPosition;
  }
}

export class TorsionSpringRestorer implements Restorer {
  element: ITorsionSpring;

  fixedPoints: INamedVector3RO[];

  effortPoints: INamedVector3RO[];

  constructor(
    element: ITorsionSpring,
    // fpの相手
    fixedPoints: [INamedVector3RO, INamedVector3RO],
    // epの相手
    effortPoint: [INamedVector3RO, INamedVector3RO]
  ) {
    this.element = element;
    this.fixedPoints = fixedPoints;
    this.effortPoints = effortPoint;
  }

  restore(unresolvedPoints: {[key: string]: Vector3}) {
    const points = this.element.getPoints().map((p) => p.value);
    const fps = points.slice(0, 2);
    const eps = points.slice(2);
    // 回転側はeps0固定側はeps1

    const fpsTo = this.fixedPoints.map((p) => {
      if (unresolvedPoints[p.nodeID]) return unresolvedPoints[p.nodeID];
      const fpParent = p.parent as IElement;
      return p.value
        .applyQuaternion(fpParent.rotation.value)
        .add(fpParent.position.value);
    });
    const epsTo = this.effortPoints.map((p) => {
      if (unresolvedPoints[p.nodeID]) return unresolvedPoints[p.nodeID];
      const epParent = this.effortPoints[1].parent as IElement;
      return p.value
        .applyQuaternion(epParent.rotation.value)
        .add(epParent.position.value);
    });
    const s = fps[1].clone().sub(fps[0]).normalize();
    const sTo = fpsTo[1].clone().sub(fpsTo[0]).normalize();
    const rotation1 = new Quaternion().setFromUnitVectors(s, sTo);
    // 軸合わせ
    points.forEach((p) => p.applyQuaternion(rotation1));

    const eTmp = eps[1].clone().sub(fps[0]);
    const e = eTmp
      .clone()
      .sub(sTo.clone().multiplyScalar(sTo.dot(eTmp)))
      .normalize();
    const eToTmp = epsTo[1].clone().sub(fpsTo[0]);
    const eTo = eToTmp
      .clone()
      .sub(sTo.clone().multiplyScalar(sTo.dot(eToTmp)))
      .normalize();
    const rotation2 = new Quaternion().setFromUnitVectors(e, eTo);
    // ロッドエンドの位置まで回転

    points.forEach((p) => p.applyQuaternion(rotation2));
    const rot = rotation2.multiply(rotation1);
    // const rot = rotation1;

    const deltaP = fpsTo[0].clone().sub(fps[0]);
    this.element.rotation.value = rot;
    this.element.position.value = deltaP;

    // もう一方のロッドエンドの位置までの必要回転量をdeltaLへ
    const e2Tmp = eps[0].clone().sub(fps[0]);
    const e2ToTmp = epsTo[0].clone().sub(fpsTo[0]);
    const e2 = e2Tmp
      .clone()
      .sub(sTo.clone().multiplyScalar(sTo.dot(e2Tmp)))
      .normalize();
    const e2To = e2ToTmp
      .clone()
      .sub(sTo.clone().multiplyScalar(sTo.dot(e2ToTmp)))
      .normalize();
    const sin = e2.cross(e2To);
    const sign = sin.dot(s) > 0 ? 1 : -1;
    this.element.dlCurrent = (Math.asin(sign * sin.length()) * 180) / Math.PI;
  }
}
