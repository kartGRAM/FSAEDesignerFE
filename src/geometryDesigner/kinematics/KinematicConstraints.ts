import {isObject} from '@utils/helpers';
import {Sphere} from './KinematicConstraints/Sphere';
import {Hinge} from './KinematicConstraints/Hinge';
import {
  BarAndSpheres,
  isBarAndSpheres
} from './KinematicConstraints/BarAndSpheres';
import {
  LinearBushingSingleEnd,
  isLinearBushingSingleEnd
} from './KinematicConstraints/LinearBushingSingleEnd';
import {
  PointToPlane,
  isPointToPlane
} from './KinematicConstraints/PointToPlane';
import {QuaternionConstraint} from './KinematicConstraints/QuaternionConstraint';

export {Sphere, Hinge};
export {BarAndSpheres, isBarAndSpheres};
export {LinearBushingSingleEnd, isLinearBushingSingleEnd};
export {PointToPlane, isPointToPlane};
export {QuaternionConstraint};

export interface deltaL {
  hasDl: true;
  dl: number;
  readonly controledBy: string[];
  readonly controled: boolean;
}

export function hasDl(object: any): object is deltaL {
  return isObject(object) && object.hasDl;
}

export function controled(object: any): object is deltaL {
  return isObject(object) && object.hasDl && object.controled;
}
