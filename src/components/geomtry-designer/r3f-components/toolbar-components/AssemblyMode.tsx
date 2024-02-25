import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {setAssemblyMode} from '@store/reducers/dataGeometryDesigner';
import {RootState} from '@store/store';
import FixedFrame from '@gdComponents/svgs/FixedFrame';
import AllTiresGrounded from '@gdComponents/svgs/AllTiresGrounded';
import {setAssembled} from '@store/reducers/uiTempGeometryDesigner';

export default function AssemblyMode() {
  const assemblyMode = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(
      setAssemblyMode(
        assemblyMode === 'FixedFrame' ? 'AllTiresGrounded' : 'FixedFrame'
      )
    );
    dispatch(setAssembled(false));
  };

  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);

  return assemblyMode === 'FixedFrame' ? (
    <FixedFrame
      sx={{padding: 0.5}}
      onClick={handleOnClick}
      title="Switch to tire grounding mode"
      disabled={disabled}
    />
  ) : (
    <AllTiresGrounded
      sx={{padding: 0.5}}
      onClick={handleOnClick}
      title="Switch to fixed frame mode"
      disabled={disabled}
    />
  );
}
