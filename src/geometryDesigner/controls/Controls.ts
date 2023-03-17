import {IDataControl, Control} from '@gd/controls/IControls';
import {
  LinearBushingControl,
  isILinearBushingControl
} from './LinearBushingControl';

export function getControl(control: IDataControl): Control {
  if (isILinearBushingControl(control))
    return new LinearBushingControl(control);
  throw Error('Not Supported Exception');
}
