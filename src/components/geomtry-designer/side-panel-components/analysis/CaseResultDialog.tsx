import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  InputLabel,
  FormControl
} from '@mui/material';
import {useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {setUIDisabled} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setCaseResultDialogPosition} from '@store/reducers/uiGeometryDesigner';
import {ITest} from '@gd/analysis/ITest';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {getCases} from '@gd/charts/getPlotlyData';

export const CaseResultDialog = React.memo(
  (props: {open: boolean; exitReplayMode: () => void; test: ITest}) => {
    const {open, exitReplayMode, test} = props;
    const {uitgd} = store.getState();
    const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex + 1;
    const dispatch = useDispatch();

    const handleOK = () => {
      exitReplayMode();
    };

    React.useEffect(() => {
      if (open) {
        dispatch(setUIDisabled(true));
      } else {
        dispatch(setUIDisabled(false));
      }
    }, [open, dispatch]);

    return (
      <Dialog
        open={open}
        components={{Backdrop: undefined}}
        PaperComponent={(props) =>
          PaperComponentDraggable({
            ...props,
            position: (state: RootState) =>
              state.uigd.present.dialogState
                .caseResultDialogInitialPosition ?? {x: null, y: null},
            setPosition: setCaseResultDialogPosition
          })
        }
        aria-labelledby="draggable-dialog-title"
        sx={{
          zIndex: `${zindex}!important`,
          pointerEvents: 'none'
        }}
      >
        <DialogTitle>Replay Mode</DialogTitle>
        <CaseResultContent test={test} />
        <DialogActions>
          <Button onClick={handleOK}>Back</Button>
        </DialogActions>
      </Dialog>
    );
  }
);

const CaseResultContent = React.memo((props: {test: ITest}) => {
  const {test} = props;
  const {solver} = test;

  const cases = getCases(solver.caseResults).slice(1);
  const [caseID, setCaseID] = React.useState<string>(cases[0]?.nodeID ?? '');
  const id = React.useId();

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;
  return (
    <DialogContent sx={{minWidth: '20vw', pt: '0.7rem!important'}}>
      <FormControl fullWidth>
        <InputLabel id={id}>Case</InputLabel>
        <Select
          disabled={cases.length === 0}
          value={caseID}
          labelId={id}
          label="Case"
          onChange={(e) => setCaseID(e.target.value)}
          sx={{flexGrow: '1'}}
          MenuProps={{
            sx: {zIndex: menuZIndex}
          }}
        >
          {cases.map((c) => (
            <MenuItem value={c.nodeID} key={c.nodeID}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </DialogContent>
  );
});
