import {IDataControl, Control} from '@gd/controls/IControls';
import {
  LinearBushingControl,
  isDataLinearBushingControl
} from './LinearBushingControl';
import {DistanceControl, isDataDistanceControl} from './DistanceControl';
import {
  PointToPlaneControl,
  isDataPointToPlaneControl
} from './PointToPlaneControl';
import {
  SkidpadSolverControl,
  isDataSkidpadSolverControl
} from './SkidpadSolverControl';
import {
  ExistingConstraintControl,
  isDataExistingConstraintControl
} from './ExistingConstraintControl';

export function getControl(control: IDataControl): Control {
  if (isDataLinearBushingControl(control))
    return new LinearBushingControl(control);
  if (isDataDistanceControl(control)) return new DistanceControl(control);
  if (isDataPointToPlaneControl(control))
    return new PointToPlaneControl(control);
  if (isDataExistingConstraintControl(control))
    return new ExistingConstraintControl(control);
  if (isDataSkidpadSolverControl(control))
    return new SkidpadSolverControl(control);
  throw Error('Not Supported Exception');
}
