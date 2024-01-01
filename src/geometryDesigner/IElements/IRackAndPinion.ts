import {Radian} from '../IElements';
import {ILinearBushing} from './ILinearBushing';

export interface IRackAndPinion extends ILinearBushing {
  readonly dlPerRad: Radian;
}
