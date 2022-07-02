import * as React from 'react';
import {FormulaDialog} from '@gdComponents/dialog-components/FormulaDialog';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

export default function DialogRoot() {
  const fullScreenZ = useSelector(
    (state: RootState) => state.uitgd.fullScreenZIndex
  );
  return (
    <FormulaDialog
      open
      sx={{
        zIndex: `${fullScreenZ + 10000}!important`,
        backdropFilter: 'blur(3px)'
      }}
    />
  );
}
