import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {
  getElementByPath,
  isAArm,
  isBar,
  isBellCrank,
  isBody,
  isTire,
  isAssembly
} from '@gd/IElements';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import AArmConfig from './AArmConfig';
import BarConfig from './BarConfig';
import BellCrankConfig from './BellCrankConfig';
import BodyConfig from './BodyConfig';
import TireConfig from './TireConfig';
import AssemblyConfig from './AssemblyConfig';

export default function ParametersRoot() {
  const path = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );
  const topAssy = useSelector((state: RootState) => state.uitgd.assembly);

  const dispatch = useDispatch();
  React.useEffect(() => {
    return () => {
      dispatch(setSelectedPoint({point: null}));
    };
  }, []);

  const element = getElementByPath(topAssy, path);
  // eslint-disable-next-line no-undef
  let component: JSX.Element | null = null;
  if (element && isAArm(element)) {
    component = <AArmConfig element={element} key={element.absPath} />;
  } else if (element && isBar(element)) {
    component = <BarConfig element={element} key={element.absPath} />;
  } else if (element && isBellCrank(element)) {
    component = <BellCrankConfig element={element} key={element.absPath} />;
  } else if (element && isBody(element)) {
    component = <BodyConfig element={element} key={element.absPath} />;
  } else if (element && isTire(element)) {
    component = <TireConfig element={element} key={element.absPath} />;
  } else if (element && isAssembly(element)) {
    component = <AssemblyConfig assembly={element} key={element.absPath} />;
  }

  return component;
}
