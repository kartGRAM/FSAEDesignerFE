import * as React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  getElementByPath,
  isAArm,
  isBar,
  isBellCrank,
  isBody,
  isTire
} from '@gd/IElements';
import {getAssembly} from '@gd/Elements';
import AArmConfig from './AArmConfig';
import BarConfig from './BarConfig';
import BellCrankConfig from './BellCrankConfig';
import BodyConfig from './BodyConfig';
import TireConfig from './TireConfig';

export default function ParametersRoot() {
  const path = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );
  const topAssy = getAssembly(
    useSelector((state: RootState) => state.dgd.present.topAssembly)!
  );
  const element = getElementByPath(topAssy, path);
  // eslint-disable-next-line no-undef
  let component: JSX.Element | null = null;
  if (element && isAArm(element)) {
    component = <AArmConfig element={element} />;
  } else if (element && isBar(element)) {
    component = <BarConfig element={element} />;
  } else if (element && isBellCrank(element)) {
    component = <BellCrankConfig element={element} />;
  } else if (element && isBody(element)) {
    component = <BodyConfig element={element} />;
  } else if (element && isTire(element)) {
    component = <TireConfig element={element} />;
  }

  return component;
}
