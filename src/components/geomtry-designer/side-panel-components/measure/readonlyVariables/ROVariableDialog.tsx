import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {IReadonlyVariable} from '@gd/measure/readonlyVariables/IReadonlyVariable';
import {setUIDisabled} from '@store/reducers/uiTempGeometryDesigner';
import Divider from '@mui/material/Divider';
import {setMeasureToolDialogPosition} from '@store/reducers/uiGeometryDesigner';
import {ReadonlyVariable} from '@gd/measure/readonlyVariables/ReadonlyVariable';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';
import {VariableSourceSelector} from './VariableSourceSelector';
import {VariableFormula} from './VariableFormula';

export function ROVariableDialog(props: {
  open: boolean;
  close: () => void;
  apply: (variable: IReadonlyVariable) => void;
  variable?: IReadonlyVariable;
  selectableVariables: IReadonlyVariable[];
}) {
  const {open, close, apply, selectableVariables} = props;
  const {variable: propsVariable} = props;
  let variable: IReadonlyVariable = new ReadonlyVariable({
    name: 'New Variable'
  });

  const dispatch = useDispatch();

  const dialogZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.dialogZIndex
  );
  const [applyReady, setApplyReady] = React.useState<
    IReadonlyVariable | undefined
  >(undefined);

  if (applyReady) variable = applyReady;
  else if (propsVariable) variable.copy(propsVariable);

  const handleOK = () => {
    if (!applyReady) return;
    apply(applyReady);
    close();
  };
  const handleCancel = () => {
    close();
  };
  const handleApply = () => {
    if (!applyReady) return;
    apply(applyReady);
  };

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      // TransitionProps={{unmountOnExit: true}}
      components={{Backdrop: undefined}}
      PaperComponent={(props) =>
        PaperComponentDraggable({
          ...props,
          position: (state: RootState) =>
            state.uigd.present.dialogState.measureToolDialogInitialPosition,
          setPosition: setMeasureToolDialogPosition
        })
      }
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${dialogZIndex}!important`,
        pointerEvents: 'none'
      }}
      PaperProps={{
        sx: {
          minWidth: 900,
          maxHeight: '70vh'
        }
      }}
    >
      <EditableTypography
        typography={
          <DialogTitle sx={{marginRight: 10}}>{variable.name}</DialogTitle>
        }
        initialValue={variable.name}
        validation={Yup.string().required('required')}
        onSubmit={(value) => {
          if (variable.name !== value) {
            variable.name = value;
            setApplyReady(variable);
          }
        }}
      />
      <DialogContent>
        <VariableFormula variable={variable} setApplyReady={setApplyReady} />
        <Divider sx={{mb: 2}} />
        <VariableSourceSelector
          roVariable={variable}
          selectableVariables={selectableVariables}
          setApplyReady={setApplyReady}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleApply} disabled={!applyReady}>
          Appy
        </Button>
        <Button onClick={handleOK} disabled={!applyReady}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
