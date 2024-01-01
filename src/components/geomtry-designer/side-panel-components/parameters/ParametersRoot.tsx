import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {getElementByPath} from '@gd/IElements';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {Box} from '@mui/material';
import {alpha} from '@mui/material/styles';
import {isAssembly} from '@gd/IElements/IAssembly';
import {isAArm} from '@gd/IElements/IAArm';
import {isBar} from '@gd/IElements/IBar';
import {isBellCrank} from '@gd/IElements/IBellCrank';
import {isBody} from '@gd/IElements/IBody';
import {isLinearBushing} from '@gd/IElements/ILinearBushing';
import {isSpringDumper} from '@gd/IElements/ISpringDumper';
import {isTire} from '@gd/IElements/ITire';
import AArmConfig from './AArmConfig';
import BarConfig from './BarConfig';
import SpringDumperConfig from './SpringDumperConfig';
import BellCrankConfig from './BellCrankConfig';
import BodyConfig from './BodyConfig';
import TireConfig from './TireConfig';
import LinearBushingConfig from './LinearBushingConfig';
import AssemblyConfig from './AssemblyConfig';

export default function ParametersRoot() {
  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);
  const path = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );
  const topAssy = useSelector((state: RootState) => state.uitgd.assembly);
  const dispatch = useDispatch();
  React.useEffect(() => {
    return () => {
      dispatch(setSelectedPoint(null));
    };
  }, [dispatch]);

  const element = getElementByPath(topAssy, path);

  let component: JSX.Element | null = null;
  if (element && isAArm(element)) {
    component = <AArmConfig element={element} key={element.absPath} />;
  } else if (element && isBar(element)) {
    component = <BarConfig element={element} key={element.absPath} />;
  } else if (element && isSpringDumper(element)) {
    component = <SpringDumperConfig element={element} key={element.absPath} />;
  } else if (element && isBellCrank(element)) {
    component = <BellCrankConfig element={element} key={element.absPath} />;
  } else if (element && isBody(element)) {
    component = <BodyConfig element={element} key={element.absPath} />;
  } else if (element && isTire(element)) {
    component = <TireConfig element={element} key={element.absPath} />;
  } else if (element && isLinearBushing(element)) {
    component = <LinearBushingConfig element={element} key={element.absPath} />;
  } else if (element && isAssembly(element)) {
    component = <AssemblyConfig assembly={element} key={element.absPath} />;
  }

  return (
    <Box component="div" sx={{position: 'relative'}}>
      {component}

      <Box
        component="div"
        sx={{
          backgroundColor: alpha('#000', 0.3),
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: disabled ? 'unset' : 'none'
        }}
      />
    </Box>
  );
}
