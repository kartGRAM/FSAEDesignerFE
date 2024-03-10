/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {useFormik} from 'formik';
import {
  Dialog,
  DialogContent,
  Button,
  DialogActions,
  Box,
  Typography,
  NativeSelect,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';
import {PaperProps} from '@mui/material/Paper';
import {ITest, ISteadySkidpadParams} from '@gd/analysis/ITest';
import {initialSteadySkidpadParams} from '@gd/analysis/Test';
import useTestUpdate from '@hooks/useTestUpdate';
import Scalar from '@gdComponents/Scalar';
import {ParameterSetter} from '@gd/analysis/ParameterSetter';
import {createDummyDataControl} from '@gd/controls/IControls';
import {getControl} from '@gd/controls/Controls';
import yup from '@app/utils/Yup';
import {isTire, ITire} from '@gd/IElements/ITire';
import {listTireData} from '@tire/listTireData';
import StandardTextField from '@gdComponents/StandardTextField';

export const SkidpadConfigDialog = React.memo(
  (props: {
    test: ITest;
    open: boolean;
    onClose: () => void;
    onApply?: () => void;
    onCancel?: () => void;
    paperProps?: PaperProps;
  }) => {
    const {open, test, onClose, onApply, onCancel, paperProps} = props;

    useTestUpdate(test);
    const [stateAtOpen, setStateAtOpen] = React.useState<string>('');
    if (open) test.undoBlockPoint = stateAtOpen;
    const dispatch = useDispatch();

    React.useEffect(() => {
      if (open) {
        setStateAtOpen(test.getLocalStateID());
      } else {
        test.undoBlockPoint = '';
      }
    }, [open, test]);

    const {uitgd} = store.getState();
    const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex * 2;

    const changed = stateAtOpen !== test.getLocalStateID();

    const handleApply = React.useCallback(() => {
      test.saveLocalState();
      // test.asLastestState();
      const lastestID = test.getLocalStateID();
      test.squashLocalStates(stateAtOpen, lastestID);
      setStateAtOpen(lastestID);
      if (onApply) onApply();
    }, [onApply, test, stateAtOpen]);

    const handleOK = React.useCallback(() => {
      handleApply();
      onClose();
    }, [handleApply, onClose]);

    const handleCancel = React.useCallback(async () => {
      if (changed) {
        const ret = await new Promise<string>((resolve) => {
          dispatch(
            setConfirmDialogProps({
              zindex: zindex + 10000 + 1,
              onClose: resolve,
              title: 'Warning',
              message: `All changes will not be saved. Are you okay?`,
              buttons: [
                {text: 'OK', res: 'ok'},
                {text: 'Cancel', res: 'cancel', autoFocus: true}
              ]
            })
          );
        });

        if (ret !== 'ok') {
          return;
        }
      }
      if (onCancel) {
        onCancel();
      }
      test.loadLocalState(stateAtOpen);
      test.asLastestState();
      onClose();
    }, [changed, onCancel, test, stateAtOpen, onClose, dispatch, zindex]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const window = document.getElementById('gdAppArea');
    return (
      <Dialog
        onClick={(e) => e.stopPropagation()}
        open={open}
        container={window}
        maxWidth={false}
        TransitionProps={{unmountOnExit: true}}
        onClose={handleCancel}
        sx={{
          position: 'absolute',
          zIndex: `${zindex}!important`,
          overflow: 'hidden'
        }}
        PaperProps={paperProps || {sx: {minWidth: '60%', height: '60%'}}}
      >
        <DialogContent
          sx={{
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}
        >
          <Content test={test} />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleApply} disabled={!changed}>
            Apply
          </Button>
          <Button onClick={handleOK} disabled={!changed}>
            OK
          </Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </DialogActions>
      </Dialog>
    );
  }
);
export default SkidpadConfigDialog;

const Content = React.memo((props: {test: ITest}) => {
  const {test} = props;
  const {updateWithSave} = useTestUpdate(test);
  const assemblyMode = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter(
    (c) =>
      (c.configuration ?? 'FixedFrame') === assemblyMode &&
      !c.disabledWhileDynamicSolverIsActive
  );

  const elements = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly?.children ?? []
  );
  const tireElements = elements.filter((e) => isTire(e)) as ITire[];
  const config: ISteadySkidpadParams =
    test.steadySkidpadParams ?? initialSteadySkidpadParams();
  const apply = <E, V>(func?: (e?: E, v?: V) => void) => {
    return (e?: E, v?: V) => {
      if (func) func(e, v);
      test.steadySkidpadParams = config;
      updateWithSave();
    };
  };

  const fieldSX = {minWidth: 330};
  const tireData = listTireData();

  const schema = yup
    .number()
    .typeError('You must specify a number.')
    .required('required')
    .min(0, 'You must specify a greater number than 0.')
    .test(
      'check sum of ratio > 0',
      'Sum of ratio must greater than 0.',
      // eslint-disable-next-line func-names
      function (this: yup.TestContext, ratio: number | undefined | null) {
        const valid = true;
        const inValid = false;
        // eslint-disable-next-line react/no-this-in-sfc
        const name = this.path;
        const sum = tireElements.reduce((prev, tire) => {
          if (tire.nodeID === name) return prev;
          // eslint-disable-next-line react/no-this-in-sfc
          prev += this.parent[tire.nodeID];
          return prev;
        }, 0);
        if (ratio === undefined) return valid;
        if (ratio === null) return valid;
        // 合計は0以上である必要がある
        return sum + ratio <= 0 ? inValid : valid;
      }
    );

  const initialValues = tireElements.reduce((prev, tire) => {
    prev[tire.nodeID] = config.tireTorqueRatio[tire.nodeID] ?? 1;
    return prev;
  }, {} as {[index: string]: number});
  const validationSchema = yup.object(
    tireElements.reduce((prev, tire) => {
      prev[tire.nodeID] = schema;
      return prev;
    }, {} as {[index: string]: typeof schema})
  );
  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      apply(() => {
        config.tireTorqueRatio = values;
      })();
    }
  });

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    formik.handleSubmit();
    formik.handleBlur(e);
  };

  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {config.solverMode === 'SkidpadMaxV' ? (
        <>
          <Box
            component="div"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="subtitle1">skidpad radius</Typography>
            <Scalar
              nameUnvisible
              value={config.radius}
              unit="m"
              onUpdate={apply()}
              valueFieldProps={{sx: fieldSX}}
            />
          </Box>
          <Box
            component="div"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="subtitle1">initial velocity</Typography>
            <Scalar
              nameUnvisible
              value={config.velocity}
              unit="m/s"
              onUpdate={apply()}
              valueFieldProps={{sx: fieldSX}}
            />
          </Box>
        </>
      ) : (
        <>
          <Box
            component="div"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="subtitle1">
              skidpad constant velocity
            </Typography>
            <Scalar
              nameUnvisible
              value={config.velocity}
              unit="m/s"
              onUpdate={apply()}
              valueFieldProps={{sx: fieldSX}}
            />
          </Box>
          <Box
            component="div"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="subtitle1">initial radius</Typography>
            <Scalar
              nameUnvisible
              value={config.radius}
              unit="m"
              onUpdate={apply()}
              valueFieldProps={{sx: fieldSX}}
            />
          </Box>
        </>
      )}
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">steering control</Typography>
        <NativeSelect
          variant="standard"
          value={config.steering.target}
          onChange={apply((e) => {
            let control = controls.find(
              (c) =>
                c.nodeID === e?.target.value &&
                (c.configuration ?? 'FixedFrame') === assemblyMode &&
                !c.disabledWhileDynamicSolverIsActive
            );
            if (!control) control = createDummyDataControl();
            config.steering = new ParameterSetter({
              type: 'Control',
              target: control,
              valueFormula: '0'
            });
          })}
          sx={{...fieldSX, m: 2, mb: 2.5, mt: 2.5}}
        >
          <option value="dummy">not selected</option>
          {controls.map((control) => (
            <option value={control.nodeID}>{getControl(control).name}</option>
          ))}
        </NativeSelect>
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          steering max actuator step size
        </Typography>
        <Scalar
          nameUnvisible
          value={config.steeringMaxStepSize}
          unit="-"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          mr: 2,
          mt: 1.5,
          mb: 1.5
        }}
      >
        <Accordion sx={{width: '100%'}}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>tire data</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}
          >
            {tireElements.map((tire) => {
              return (
                <Box
                  component="div"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="subtitle1" sx={{pl: 2}}>
                    {tire.name.value}
                  </Typography>
                  <NativeSelect
                    variant="standard"
                    value={config.tireData[tire.nodeID] ?? 'defaultSlickTire'}
                    onChange={apply((e) => {
                      config.tireData[tire.nodeID] =
                        e?.target.value ?? 'defaultSlickTire';
                    })}
                    sx={{...fieldSX, m: 2, mb: 2.5, mt: 2.5}}
                  >
                    {Object.keys(tireData).map((id) => (
                      <option value={id}>{tireData[id]}</option>
                    ))}
                  </NativeSelect>
                </Box>
              );
            })}
          </AccordionDetails>
        </Accordion>
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          mr: 2,
          mt: 1.5,
          mb: 1.5
        }}
      >
        <Accordion sx={{width: '100%'}}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>torque ratio</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}
          >
            {tireElements.map((tire) => {
              return (
                <Box
                  component="div"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="subtitle1" sx={{pl: 2}}>
                    {tire.name.value}
                  </Typography>
                  <StandardTextField
                    type="number"
                    hiddenLabel
                    name={tire.nodeID}
                    onBlur={onBlur}
                    onChange={formik.handleChange}
                    onKeyDown={onEnter}
                    value={formik.values[tire.nodeID]}
                    error={
                      formik.touched[tire.nodeID] &&
                      formik.errors[tire.nodeID] !== undefined
                    }
                    helperText={
                      formik.touched[tire.nodeID] && formik.errors[tire.nodeID]
                    }
                  />
                </Box>
              );
            })}
          </AccordionDetails>
        </Accordion>
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          global Cd (entire force is applied to the center of gravity)
        </Typography>
        <Scalar
          nameUnvisible
          value={config.globalCd}
          unit="N/(m/s)^2"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          global Cl (entire force is applied to the center of gravity)
        </Typography>
        <Scalar
          nameUnvisible
          value={config.globalCl}
          unit="N/(m/s)^2"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">store intermidiate results</Typography>
        <Checkbox
          sx={{m: 1, mb: 2.75, mt: 1}}
          checked={config.storeIntermidiateResults}
          onChange={apply((e, v) => {
            config.storeIntermidiateResults = !!v;
          })}
          inputProps={{'aria-label': 'store intermidiate results'}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">solution search method</Typography>
        <NativeSelect
          variant="standard"
          value={config.searchMode}
          onChange={apply((e) => {
            config.searchMode = (e?.target.value ??
              'binary') as typeof config.searchMode;
          })}
          sx={{...fieldSX, m: 2, mb: 2.5, mt: 2.5}}
        >
          <option value="binary">binary</option>
          <option value="step">step</option>
        </NativeSelect>
      </Box>
      {config.searchMode === 'step' ? (
        config.solverMode === 'SkidpadMaxV' ? (
          <Box
            component="div"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="subtitle1">velocity step size</Typography>
            <Scalar
              nameUnvisible
              value={config.velocityStepSize}
              unit="m/s"
              onUpdate={apply()}
              valueFieldProps={{sx: fieldSX}}
            />
          </Box>
        ) : (
          <Box
            component="div"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="subtitle1">radius step size</Typography>
            <Scalar
              nameUnvisible
              value={config.radiusStepSize}
              unit="m"
              onUpdate={apply()}
              valueFieldProps={{sx: fieldSX}}
            />
          </Box>
        )
      ) : null}
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          steering convergence criteria
        </Typography>
        <Scalar
          nameUnvisible
          value={config.steeringEps}
          unit="-"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          velocity convergence criteria
        </Typography>
        <Scalar
          nameUnvisible
          value={config.velocityEps}
          unit="-"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">radius convergence criteria</Typography>
        <Scalar
          nameUnvisible
          value={config.radiusEps}
          unit="-"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          laptime convergence criteria
        </Typography>
        <Scalar
          nameUnvisible
          value={config.lapTimeEps}
          unit="-"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      {config.solverMode === 'SkidpadMaxV' ? (
        <Box
          component="div"
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="subtitle1">
            the number of iterations to determine the maximum speed.
          </Typography>
          <Scalar
            nameUnvisible
            value={config.maxLoopCountV}
            unit="-"
            onUpdate={apply()}
            valueFieldProps={{sx: fieldSX}}
          />
        </Box>
      ) : null}
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          the number of iterations to determine the radius.
        </Typography>
        <Scalar
          nameUnvisible
          value={config.maxLoopCountR}
          unit="-"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle1">
          the number of iterations to Newton solver.
        </Typography>
        <Scalar
          nameUnvisible
          value={config.maxLoopNewton}
          unit="-"
          onUpdate={apply()}
          valueFieldProps={{sx: fieldSX}}
        />
      </Box>
    </Box>
  );
});
