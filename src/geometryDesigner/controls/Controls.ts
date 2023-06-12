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

export function getControl(control: IDataControl): Control {
  if (isDataLinearBushingControl(control))
    return new LinearBushingControl(control);
  if (isDataDistanceControl(control)) return new DistanceControl(control);
  if (isDataPointToPlaneControl(control))
    return new PointToPlaneControl(control);
  throw Error('Not Supported Exception');
}
