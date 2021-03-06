import * as React from 'react';
import {FormulaDialog} from '@gdComponents/dialog-components/FormulaDialog';
import {OpenDialog} from '@gdComponents/dialog-components/OpenDialog';
import ConfirmDialog from '@gdComponents/dialog-components/ConfirmDialog';
import {SaveAsDialog} from '@gdComponents/dialog-components/SaveAsDialog';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

export default function DialogRoot() {
  const fullScreenZ = useSelector(
    (state: RootState) => state.uitgd.fullScreenZIndex
  );

  const saveAsDialogProps = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.saveAsDialogProps
  );
  return (
    <>
      <FormulaDialog />
      <OpenDialog
        open
        zindex={fullScreenZ + 10000}
        sx={{
          zIndex: `${fullScreenZ + 10000}!important`,
          backdropFilter: 'blur(3px)'
        }}
      />
      {saveAsDialogProps ? <SaveAsDialog {...saveAsDialogProps} /> : null}
      <ConfirmDialog />
    </>
  );
}
