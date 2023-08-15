import * as React from 'react';
import {FormulaDialog} from '@gdComponents/dialog-components/FormulaDialog';
import {OpenDialog} from '@gdComponents/dialog-components/OpenDialog';
import ConfirmDialog from '@gdComponents/dialog-components/ConfirmDialog';
import {SaveAsDialog} from '@gdComponents/dialog-components/SaveAsDialog';
import {CopyFromExistingPointsDialog} from '@gdComponents/dialog-components/CopyFromExistingPointsDialog';
import {MovePointDialog} from '@gdComponents/dialog-components/MovePointDialog';
import {MoveComponentDialog} from '@gdComponents/dialog-components/MoveComponentDialog';
import {RecordingDialog} from '@gdComponents/dialog-components/RecordingDialog';
import {useSelector} from 'react-redux';
import store, {RootState} from '@store/store';

export default function DialogRoot() {
  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;

  const saveAsDialogProps = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.saveAsDialogProps
  );
  return (
    <>
      <FormulaDialog />
      <OpenDialog
        open
        zindex={zIndex}
        sx={{
          zIndex: `${zIndex}!important`,
          backdropFilter: 'blur(3px)'
        }}
      />
      {saveAsDialogProps ? <SaveAsDialog {...saveAsDialogProps} /> : null}
      <ConfirmDialog />
      <CopyFromExistingPointsDialog />
      <MovePointDialog />
      <MoveComponentDialog />
      <RecordingDialog />
    </>
  );
}
