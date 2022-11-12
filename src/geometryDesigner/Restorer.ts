/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {
  IElement,
  IAArm,
  IBar,
  ITire,
  ILinearBushing,
  JointAsVector3,
  isSpringDumper
} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
import {Vector3, Quaternion} from 'three';

export interface Restorer {
  restore(): void;
}

export class BarRestorer implements Restorer {
  element: IBar;

  fixedPoint: INamedVector3;

  point: INamedVector3;

  constructor(element: IBar, fixedPoint: INamedVector3, point: INamedVector3) {
    this.element = element;
    this.fixedPoint = fixedPoint;
    this.point = point;
  }

  restore() {
    const fp = this.element.fixedPoint.value;
    const fpParent = this.fixedPoint.parent as IElement;
    const pParent = this.point.parent as IElement;
    const fpTo = this.fixedPoint.value
      .applyQuaternion(fpParent.rotation.value)
      .add(fpParent.position.value);
    const s = this.element.point.value.sub(fp).normalize();

    const pTo = this.point.value
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

  fixedPoints: [INamedVector3, INamedVector3];

  point: INamedVector3;

  constructor(
    element: IAArm,
    fixedPoints: [INamedVector3, INamedVector3],
    point: INamedVector3
  ) {
    this.element = element;
    this.fixedPoints = fixedPoints;
    this.point = point;
  }

  restore() {
    const fps = this.element.fixedPoints.map((fp) => fp.value);
    const fpParent = this.fixedPoints[0].parent as IElement;
    const fpTo = this.fixedPoints.map((p) =>
      p.value
        .applyQuaternion(fpParent.rotation.value)
        .add(fpParent.position.value)
    );
    const s1 = fps[1].clone().sub(fps[0]).normalize();
    const s1To = fpTo[1].clone().sub(fpTo[0]).normalize();
    const rot1 = new Quaternion().setFromUnitVectors(s1, s1To);

    const pParent = this.point.parent as IElement;
    const pTo = this.point.value
      .applyQuaternion(pParent.rotation.value)
      .add(pParent.position.value);
    const p = this.element.points[0].value.applyQuaternion(rot1);
    fps.forEach((fp) => fp.applyQuaternion(rot1));
    // fp0からp
    const s2tmp = p.clone().sub(fps[0]);
    const s2Totmp = pTo.clone().sub(fpTo[0]);
    const s2 = s2tmp
      .clone()
      .sub(s1To.clone().multiplyScalar(s1To.dot(s2tmp)))
      .normalize();
    const s2To = s2Totmp
      .clone()
      .sub(s1To.clone().multiplyScalar(s1To.dot(s2Totmp)))
      .normalize();
    const rot2 = new Quaternion().setFromUnitVectors(s2, s2To);
    this.element.rotation.value = rot1.multiply(rot2);

    const fp = fps[0].applyQuaternion(rot2).add(this.element.position.value);
    const deltaP = fpTo[0].sub(fp);
    this.element.position.value = this.element.position.value.add(deltaP);
  }
}

export class TireRestorer implements Restorer {
  element: ITire;

  leftBearing: INamedVector3;

  rightBearing: INamedVector3;

  constructor(
    element: ITire,
    leftBearing: INamedVector3,
    rightBearing: INamedVector3
  ) {
    this.element = element;
    this.leftBearing = leftBearing;
    this.rightBearing = rightBearing;
  }

  restore() {
    const fp = this.element.leftBearing.value;
    const fpParent = this.leftBearing.parent as IElement;
    const fpTo = this.leftBearing.value
      .applyQuaternion(fpParent.rotation.value)
      .add(fpParent.position.value);

    const pParent = this.rightBearing.parent as IElement;
    const pTo = this.rightBearing.value
      .applyQuaternion(pParent.rotation.value)
      .add(pParent.position.value);
    const s = this.element.rightBearing.value.sub(fp).normalize();
    const sTo = pTo.sub(fpTo).normalize();
    this.element.rotation.value = new Quaternion().setFromUnitVectors(s, sTo);

    fp.applyQuaternion(this.element.rotation.value).add(
      this.element.position.value
    );
    const deltaP = fpTo.clone().sub(fp);
    this.element.position.value = this.element.position.value.add(deltaP);
  }
}

export class RelativeConstraintRestorer implements Restorer {
  constrained: IElement;

  componentElement: IElement;

  deltaPosition: Vector3;

  deltaQuaternion: Quaternion;

  constructor(
    constrained: IElement,
    componentElement: IElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    joints: JointAsVector3[]
  ) {
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

  fixedPoints: INamedVector3[];

  point: INamedVector3;

  constructor(
    element: ILinearBushing,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fixedPoints: [INamedVector3, INamedVector3],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    point: INamedVector3
  ) {
    this.element = element;
    this.fixedPoints = fixedPoints;
    this.point = point;
  }

  restore() {
    const fps = this.element.fixedPoints.map((p) => p.value);
    const fpParent = this.fixedPoints[0].parent as IElement;

    const fpsTo = this.fixedPoints.map((p) =>
      p.value
        .applyQuaternion(fpParent.rotation.value)
        .add(fpParent.position.value)
    );
    const s = fps[1].sub(fps[0]).normalize();
    const sTo = fpsTo[1].clone().sub(fpsTo[0]).normalize();
    this.element.rotation.value = new Quaternion().setFromUnitVectors(s, sTo);

    const supportsCenter = fpsTo[1].clone().add(fpsTo[0]).multiplyScalar(0.5);
    const supportDistance = s.length();
    const pParent = this.point.parent as IElement;

    const pTo = this.point.value
      .applyQuaternion(pParent.rotation.value)
      .add(pParent.position.value);
    this.element.dlCurrent = supportDistance - pTo.sub(supportsCenter).length();
  }
}
