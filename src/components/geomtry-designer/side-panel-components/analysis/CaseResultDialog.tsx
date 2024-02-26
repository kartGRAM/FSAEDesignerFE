import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  InputLabel,
  FormControl,
  Box
} from '@mui/material';
import {useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setUIDisabled,
  setSolver,
  setAssemblyAndCollectedAssembly
} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setCaseResultDialogPosition} from '@store/reducers/uiGeometryDesigner';
import {ITest} from '@gd/analysis/ITest';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {getCases} from '@gd/charts/getPlotlyData';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import {isNumber} from '@app/utils/helpers';
import {InputBaseComponentProps} from '@mui/material/InputBase';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import useUpdateEffect from '@hooks/useUpdateEffect';
import {LocalInstances} from '@worker/getLocalInstances';

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

    const firstTime = React.useRef<LocalInstances | null>(null);
    if (!firstTime.current && open) {
      const {uitgd} = store.getState();
      firstTime.current = {
        assembly: uitgd.assembly!,
        collectedAssembly: uitgd.collectedAssembly!,
        datumManager: uitgd.datumManager!,
        measureToolsManager: uitgd.measureToolsManager!,
        roVariablesManager: uitgd.roVariablesManager!,
        solver: uitgd.solver!
      };
      const {localInstances} = test.solver;
      if (!localInstances) return null;
      dispatch(
        setAssemblyAndCollectedAssembly({
          ...localInstances,
          keepAssembled: true
        })
      );
      dispatch(setSolver(localInstances.solver));
    } else if (!open) {
      const fn = async () => {
        if (!firstTime.current) return;
        const storedInstances = firstTime.current;
        await dispatch(
          setAssemblyAndCollectedAssembly({
            ...storedInstances,
            keepAssembled: true
          })
        );
        await dispatch(setSolver(storedInstances.solver));
        storedInstances.assembly?.arrange();
        if (storedInstances.solver) {
          storedInstances.solver.postProcess();
        }
        firstTime.current = null;
      };
      fn();
    }

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
        TransitionProps={{unmountOnExit: true}}
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
  const [frame, setFrame] = React.useState<number>(1);

  const results = solver.caseResults?.cases[caseID].results;
  const max = results?.length ?? 1;
  const min = 1;

  const handleSliderFrameChange = React.useCallback(
    (event: Event, newValue: number | number[]) => {
      if (!isNumber(newValue)) newValue = newValue.shift() ?? 0;
      setFrame(newValue);
    },
    []
  );

  const handleInputFrameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFrame(event.target.value === '' ? 1 : Number(event.target.value));
    },
    []
  );

  const handleBlur = React.useCallback(() => {
    if (isNumber(frame) && frame < min) setFrame(min);
    if (isNumber(frame) && frame > max) setFrame(max);
  }, [frame, max]);

  const handleCaseChanged = React.useCallback(
    (e: SelectChangeEvent<string>) => {
      setFrame(1);
      setCaseID(e.target.value);
    },
    []
  );

  const dispatch = useDispatch();
  const id = React.useId();

  const setComponentsState = React.useCallback((ss?: ISnapshot) => {
    const {uitgd} = store.getState();
    const {solver} = uitgd;
    if (solver && ss) {
      solver.restoreState(ss);
      solver.postProcess(true);
    }
  }, []);

  React.useEffect(() => {
    if (caseID !== '' && results) {
      setComponentsState(results[0]);
    }
  }, [caseID, dispatch, results, setComponentsState, solver]);

  useUpdateEffect(() => {
    if (caseID !== '' && results) {
      setComponentsState(results[frame - 1]);
    }
  }, [caseID, results, frame, setComponentsState]);

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
          onChange={handleCaseChanged}
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
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%', pt: 2}}
      >
        <Box component="div" sx={{flexGrow: 1, mt: 0.7}}>
          <Slider
            disabled={!results || results.length === 0}
            size="small"
            aria-label="Small"
            valueLabelDisplay="auto"
            value={isNumber(frame) ? frame : 1}
            min={min}
            max={max}
            onChange={handleSliderFrameChange}
          />
        </Box>
        <ValueField
          disabled={!results || results.length === 0}
          value={frame}
          onChange={handleInputFrameChange}
          onBlur={handleBlur}
          label="frame number"
          name="frame number"
          variant="outlined"
          unit={`${
            // eslint-disable-next-line no-nested-ternary
            frame === 1 ? 'st' : frame === 2 ? 'nd' : frame === 3 ? 'rd' : 'th'
          }`}
          inputProps={{min, max, step: 1}}
        />
      </Box>
    </DialogContent>
  );
});

// eslint-disable-next-line no-redeclare
interface MyOutlinedTextFieldProps extends OutlinedTextFieldProps {
  unit: string;
  inputProps?: InputBaseComponentProps;
}

const ValueField = React.memo((props: MyOutlinedTextFieldProps) => {
  const {unit, inputProps} = props;
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
        type: 'number',
        'aria-labelledby': 'input-slider',
        inputProps
      }}
      sx={{
        marginLeft: 3
        // width: '15ch'
      }}
    />
  );
});
