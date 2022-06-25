import * as React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {getElementByPath, isAArm} from '@gd/IElements';
import {getAssembly} from '@gd/Elements';
import AArmConfig from './AArmConfig';

export default function ParametersRoot() {
  const path = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );
  const topAssy = getAssembly(
    useSelector((state: RootState) => state.dgd.topAssembly)!
  );
  const element = getElementByPath(topAssy, path);
  // eslint-disable-next-line no-undef
  let component: JSX.Element | null = null;
  if (element && isAArm(element)) {
    component = <AArmConfig element={element} />;
  }

  return component;
}
