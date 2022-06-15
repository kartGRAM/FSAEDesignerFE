import * as React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {getDataElementByPath, isDataAArm} from '@gd/IElements';
import AArmConfig from './AArmConfig';

export default function ParametersRoot() {
  const path = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );
  const topAssy = useSelector((state: RootState) => state.dgd.topAssembly);
  const element = getDataElementByPath(topAssy, path);
  // eslint-disable-next-line no-undef
  let component: JSX.Element | null = null;
  if (element && isDataAArm(element)) {
    component = <AArmConfig dataElement={element} />;
  }

  return component;
}
