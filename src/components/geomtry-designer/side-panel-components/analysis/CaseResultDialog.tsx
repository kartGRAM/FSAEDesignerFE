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
import {swapFormulae} from '@store/reducers/dataGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setCaseResultDialogPosition} from '@store/reducers/uiGeometryDesigner';
import {ITest} from '@gd/analysis/ITest';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {getCases} from '@gd/charts/getPlotlyData';
import Slider from '@mui/material/Slider';
import {isNumber} from '@app/utils/helpers';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import useUpdateEffect from '@hooks/useUpdateEffect';
import {LocalInstances} from '@worker/getLocalInstances';
import {ValueField} from '@gdComponents/ValueField';

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
      if (!firstTime.current && open) {
        const {uitgd, dgd} = store.getState();
        firstTime.current = {
          assembly: uitgd.assembly!,
          collectedAssembly: uitgd.collectedAssembly!,
          datumManager: uitgd.datumManager!,
          measureToolsManager: uitgd.measureToolsManager!,
          roVariablesManager: uitgd.roVariablesManager!,
          solver: uitgd.solver!,
          formulae: [...dgd.present.formulae],
          lastFormulaeUpdateID: dgd.present.lastGlobalFormulaUpdate
        };
        const {localInstances} = test.solver;
        if (localInstances) {
          dispatch(
            setAssemblyAndCollectedAssembly({
              ...localInstances,
              keepAssembled: true
            })
          );
          dispatch(setSolver(localInstances.solver));
        }
      } else if (!open && firstTime.current) {
        const storedInstances = firstTime.current;
        dispatch(
          setAssemblyAndCollectedAssembly({
            ...storedInstances,
            keepAssembled: true
          })
        );
        dispatch(setSolver(storedInstances.solver));
        store.dispatch(
          swapFormulae({
            formulae: storedInstances.formulae,
            lastUpdateID: storedInstances.lastFormulaeUpdateID
          })
        );
        storedInstances.assembly?.arrange();
        if (storedInstances.solver) {
          // storedInstances.solver.reConstruct();
          storedInstances.solver.postProcess();
        }
        firstTime.current = null;
      }
    }, [open, dispatch, test.solver]);

    const firstTime = React.useRef<LocalInstances | null>(null);
    // if (!firstTime.current) return null;

    return (
      <Dialog
        open={open}
        components={{Backdrop: undefined}}
        PaperComponent={(props) =>
          PaperComponentDraggable({
            ...props,
            position: (state: RootState) =>
              state.uigd.dialogState.caseResultDialogInitialPosition ?? {
                x: null,
                y: null
              },
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
        <CaseResultContent test={test} open={open} />
        <DialogActions>
          <Button onClick={handleOK}>Back</Button>
        </DialogActions>
      </Dialog>
    );
  }
);

const CaseResultContent = React.memo((props: {test: ITest; open: boolean}) => {
  const {test, open} = props;
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

  const setComponentsState = React.useCallback(
    (ss?: Required<ISnapshot>) => {
      const {uitgd} = store.getState();
      const {solver, collectedAssembly} = uitgd;
      if (solver && collectedAssembly && ss && open) {
        dispatch(
          swapFormulae({
            formulae: ss.globals,
            lastUpdateID: ss.globalsUpdateID
          })
        );
        collectedAssembly.arrange();
        solver.reConstruct();
        solver.restoreState(ss);
        solver.postProcess(true);
      }
    },
    [dispatch, open]
  );

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
          InputProps={{
            type: 'number',
            'aria-labelledby': 'input-slider',
            inputProps: {min, max, step: 1}
          }}
          sx={{
            marginLeft: 3
          }}
          unit={`${
            // eslint-disable-next-line no-nested-ternary
            frame === 1 ? 'st' : frame === 2 ? 'nd' : frame === 3 ? 'rd' : 'th'
          }`}
        />
      </Box>
    </DialogContent>
  );
});
