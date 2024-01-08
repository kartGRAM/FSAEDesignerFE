/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  DialogActions,
  Box,
  Typography
} from '@mui/material';
import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';
import {PaperProps} from '@mui/material/Paper';
import {useDispatch} from 'react-redux';
import store from '@store/store';
import {ITest, ISteadySkidpadParams} from '@gd/analysis/ITest';
import useTestUpdate from '@hooks/useTestUpdate';
import Scalar from '@gdComponents/Scalar';
import {SetterType, ParameterSetter} from '@gd/analysis/ParameterSetter';
import {NamedNumber} from '@gd/NamedValues';
import {createDummyDataControl} from '@gd/controls/IControls';
import * as Yup from 'yup';

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
        dispatch(setConfirmDialogProps(undefined));
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
  const config: ISteadySkidpadParams = test.steadySkidpadParams ?? {
    tireData: {},
    tireTorqueRatio: {},
    stearing: new ParameterSetter({
      type: 'Control',
      target: createDummyDataControl(),
      valueFormula: '0'
    }),
    velocity: new NamedNumber({name: 'velocity', value: 10}),
    radius: new NamedNumber({name: 'radius', value: 7.625}),
    globalCd: new NamedNumber({name: 'global cd', value: 0}),
    globalCl: new NamedNumber({name: 'global cl', value: 0}),
    searchMode: 'binary',
    velocityStepSize: undefined,
    radiusStepSize: undefined,
    storeIntermidiateResults: false
  };
  const scalarApply = (func?: () => void) => {
    return () => {
      if (func) func();
      test.steadySkidpadParams = config;
      updateWithSave();
    };
  };

  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {test.steadyStateDynamicsMode === 'SkidpadMaxV' ? (
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
            onUpdate={scalarApply()}
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
          <Typography variant="subtitle1">skidpad constant velocity</Typography>
          <Scalar
            nameUnvisible
            value={config.velocity}
            unit="m/s"
            onUpdate={scalarApply()}
          />
        </Box>
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
        <Typography variant="subtitle1">
          global Cd (entire force is applied to the center of gravity)
        </Typography>
        <Scalar
          nameUnvisible
          value={config.globalCd}
          unit="N/(m/s)^2"
          onUpdate={scalarApply()}
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
          onUpdate={scalarApply()}
        />
      </Box>
    </Box>
  );
});

/*
function NewRow(props: {node: ISetterNode; updateWithSave: () => void}) {
  const {updateWithSave, node} = props;
  const labelId = React.useId();
  const [evaluatedValue, setEvaluatedValue] = React.useState<number | null>(
    null
  );

  const [category, setCategory] = React.useState<SetterType | ''>('');
  const [selectedObject, setSelectedObject] = React.useState<{
    type: SetterType | 'NotSelected';
    target: string;
    valueForSelectTag: string;
  }>({type: 'NotSelected', target: '', valueForSelectTag: ''});

  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  );

  const onFormulaValidated = (formula: string) => {
    setEvaluatedValue(new Formula(formula).evaluatedValue);
  };

  const reset = () => {
    setCategory('');
    setSelectedObject({type: 'NotSelected', target: '', valueForSelectTag: ''});
    setEvaluatedValue(null);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      formula: ''
    },
    validationSchema: yup.object({
      formula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, onFormulaValidated)
    }),
    onSubmit: (values) => {
      formik.resetForm();
      if (selectedObject.type === 'Control') {
        const control = controls.find(
          (c) => c.nodeID === selectedObject.target
        );
        if (!control) return;

        const setter = new ParameterSetter({
          type: 'Control',
          target: control,
          valueFormula: values.formula
        });

        node.listSetters.push(setter);
        updateWithSave();
        reset();
      }
    }
  });

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvaluatedValue(null);
    formik.handleChange(e);
  };

  const handleTargetChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    if (value.includes('@Control')) {
      const nodeID = value.split('@')[0];
      const control = controls.find((c) => c.nodeID === nodeID);
      if (!control) return;
      setSelectedObject({
        type: 'Control',
        target: nodeID,
        valueForSelectTag: value
      });
      setCategory('Control');
    } else {
      setSelectedObject({
        type: 'NotSelected',
        target: '',
        valueForSelectTag: ''
      });
      setCategory('');
    }
  };

  const alreadyExistsInSetterList = node.listSetters.map(
    (setter) => setter.target
  );

  if (alreadyExistsInSetterList.length === controls.length) return null;

  return (
    <TableRow >
      <TableCell padding="checkbox">
        <Checkbox
          disabled
          color="primary"
          inputProps={{
            'aria-labelledby': labelId
          }}
        />
      </TableCell>
      {node.copyFrom ? (
        <TableCell padding="checkbox">
          <Checkbox
            disabled
            color="primary"
            inputProps={{
              'aria-labelledby': labelId
            }}
          />
        </TableCell>
      ) : null}
      <TableCell id={labelId} scope="row" padding="none" align="left">
        <NativeSelect
          native
          variant="standard"
          value={selectedObject.valueForSelectTag}
          onChange={handleTargetChanged}
        >
          <option aria-label="None" value="" />
          <optgroup label="Controls">
            {controls
              .filter((c) => !alreadyExistsInSetterList.includes(c.nodeID))
              .map((control) => (
                <option
                  value={`${control.nodeID}@Control`}
                  key={control.nodeID}
                >
                  {getControl(control).name}
                </option>
              ))}
          </optgroup>
        </NativeSelect>
      </TableCell>
      <TableCell align="right" padding="none">
        {category}
      </TableCell>
      <TableCell align="right">
        <TextField
          disabled={!selectedObject.valueForSelectTag}
          hiddenLabel
          name="formula"
          variant="standard"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={handleFormulaChange}
          value={formik.values.formula}
          error={formik.touched.formula && formik.errors.formula !== undefined}
          helperText={formik.touched.formula && formik.errors.formula}
        />
      </TableCell>
      <TableCell align="right">{toFixedNoZero(evaluatedValue)}</TableCell>
    </TableRow>
  );
}

function ExistingRow(props: {
  node: ISetterNode;
  row: Row;
  test: ITest;
  isItemSelected: boolean;
  labelId: string;
  onClick: (targetNodeID: string) => void;
}) {
  const {node, row, test, onClick, isItemSelected, labelId} = props;

  const {updateWithSave} = useTestUpdate(test);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      formula: row.valueFormula
    },
    validationSchema: yup.object({
      formula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, undefined)
    }),
    onSubmit: (values) => {
      formik.resetForm();
      if (row.categories === 'Control') {
        const setter = node.listSetters.find(
          (setter) => setter.target === row.targetNodeID
        );
        if (!setter) return;
        setter.valueFormula.formula = values.formula;
        updateWithSave();
      }
    }
  });

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  const color =
    node.copyFrom && !node.isModRow[row.targetNodeID]
      ? alpha('#000000', 0.36)
      : 'unset';

  return (
    <TableRow
      hover
      role="checkbox"
      aria-checked={isItemSelected}
      tabIndex={-1}
      key={row.targetNodeID}
      selected={isItemSelected}
    >
      <TableCell padding="checkbox">
        <Checkbox
          disabled={!!node.copyFrom}
          onClick={() => {
            if (node.copyFrom) return;
            onClick(row.targetNodeID);
          }}
          color="primary"
          checked={isItemSelected}
          inputProps={{
            'aria-labelledby': labelId
          }}
        />
      </TableCell>
      {node.copyFrom ? (
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={node.isModRow[row.targetNodeID]}
            onChange={(e) => {
              node.isModRow[row.targetNodeID] = e.target.checked;
              updateWithSave();
            }}
            inputProps={{
              'aria-labelledby': labelId
            }}
          />
        </TableCell>
      ) : null}
      <TableCell
        component="th"
        id={labelId}
        scope="row"
        padding="none"
        sx={{color}}
      >
        {row.name}
      </TableCell>
      <TableCell align="right" sx={{color}}>
        {row.categories}
      </TableCell>
      <TableCell align="right">
        <TextField
          disabled={!!node.copyFrom && !node.isModRow[row.targetNodeID]}
          hiddenLabel
          name="formula"
          variant="standard"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={formik.handleChange}
          value={formik.values.formula}
          error={formik.touched.formula && formik.errors.formula !== undefined}
          helperText={formik.touched.formula && formik.errors.formula}
        />
      </TableCell>
      <TableCell align="right" sx={{color}}>
        {row.evaluatedValue}
      </TableCell>
    </TableRow>
  );
}
*/
