import {TireBalance} from './SkidpadConstraints/TireBalance';
import {
  FDComponentBalance,
  isFDComponentBalance
} from './SkidpadConstraints/FDComponentBalance';
import {BarBalance, isBarBalance} from './SkidpadConstraints/BarBalance';
import {
  TorsionSpringBalance,
  isTorsionSpringBalance
} from './SkidpadConstraints/TorsionSpringBalance';
import {AArmBalance, isAArmBalance} from './SkidpadConstraints/AArmBalance';
import {
  LinearBushingBalance,
  isLinearBushingBalance
} from './SkidpadConstraints/LinearBushingBalance';

export interface Balance {
  isBalance: true;
  applytoElement(): void;
}

export function isBalance(constraint: any): constraint is Balance {
  return 'isBalance' in constraint && constraint.isBalance;
}

export {TireBalance};
export {FDComponentBalance, isFDComponentBalance};
export {BarBalance, isBarBalance};
export {TorsionSpringBalance, isTorsionSpringBalance};
export {LinearBushingBalance, isLinearBushingBalance};
export {AArmBalance, isAArmBalance};
