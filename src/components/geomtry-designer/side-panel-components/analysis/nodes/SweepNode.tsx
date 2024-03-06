import * as React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  Typography,
  Tooltip,
  IconButton,
  Checkbox,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Toolbar,
  Box,
  Table,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import useTestUpdate from '@hooks/useTestUpdate';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import {visuallyHidden} from '@mui/utils';
import {getControl} from '@gd/controls/Controls';
import {useFormik} from 'formik';
import yup from '@app/utils/Yup';
import StandardTextField from '@gdComponents/StandardTextField';
import {toFixedNoZero} from '@utils/helpers';
import {Formula} from '@gd/Formula';
import {alpha} from '@mui/material/styles';
import {Node as IRFNode, XYPosition} from 'reactflow';
import Sweep from '@gdComponents/svgs/Sweep';
import {CardNodeProps} from '@gdComponents/side-panel-components/analysis/CardNode';
import {ITest} from '@gd/analysis/ITest';
import {
  className,
  ISweepNode,
  SweepNode,
  isSweepNode
} from '@gd/analysis/SweepNode';
import {
  ParameterSweeper,
  SweeperType,
  Mode
} from '@gd/analysis/ParameterSweeper';

import {Item} from '@gd/analysis/FlowNode';

import {getRFNodeBase} from './Base';

export {isSweepNode};

export function getRFNode(
  node: ISweepNode,
  test?: ITest,
  canvasUpdate?: () => void
): IRFNode & CardNodeProps {
  const rfNode = getRFNodeBase(node, test);

  return {
    ...rfNode,
    type: 'card',
    data: {
      ...rfNode.data,
      source: true,
      target: true,
      useDialog: () => useSweepDialog({node, test, canvasUpdate})
    }
  };
}

export function getItem(): Item {
  return {
    className,
    icon: <Sweep title="Sweeper" />,
    text: 'Sweep parameters',
    onDrop: (position: XYPosition, temporary: boolean, testID: string) =>
      new SweepNode(
        {
          name: 'Parameter sweep',
          position,
          nodeID: temporary ? 'temp' : undefined
        },
        testID
      )
  };
}

function useSweepDialog(props: {
  node: ISweepNode;
  test?: ITest;
  canvasUpdate?: () => void;
}): [JSX.Element | null, React.Dispatch<React.SetStateAction<boolean>>] {
  const {node, test, canvasUpdate} = props;
  const [open, setOpen] = React.useState(false);

  const handleClose = async () => {
    setOpen(false);
    if (canvasUpdate) canvasUpdate();
  };

  return [
    test ? (
      <FlowNodeDialog
        key={node.nodeID}
        node={node}
        test={test}
        open={open}
        onClose={handleClose}
        paperProps={{}}
      >
        <SweepContent node={node} test={test} />
      </FlowNodeDialog>
    ) : null,
    setOpen
  ];
}

interface Row {
  targetNodeID: string;
  name: string;
  categories: ParameterSweeper['type'];
  startFormula: string;
  endFormula: string;
  stepFormula: string;

  startValue: number;
  endValue: number;
  step: number;
}

function SweepContent(props: {node: ISweepNode; test: ITest}) {
  const {node, test} = props;
  const {updateWithSave} = useTestUpdate(test);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mode, setMode] = React.useState<Mode>('step');
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Row>('name');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const rows = node.listSweepers.map(
    (s): Row => ({
      targetNodeID: s.target,
      name: s.name,
      categories: s.type,
      startFormula: s.startFormula.formula,
      endFormula: s.endFormula.formula,
      stepFormula: s.stepFormula.formula,
      startValue: s.startValue,
      endValue: s.endValue,
      step: s.stepValue
    })
  );

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Row
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.targetNodeID);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (targetNodeID: string) => {
    const selectedIndex = selected.indexOf(targetNodeID);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, targetNodeID);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  const potentials = Object.values(test.nodes).filter(
    (n) =>
      isSweepNode(n) && n.nodeID !== node.nodeID && n.copyFrom === undefined
  ) as ISweepNode[];

  const selectedCopyOrg =
    potentials.find((n) => n.nodeID === node.copyFrom)?.nodeID ?? '';

  const onOrgNodeSelected = (e: SelectChangeEvent<string>) => {
    const org = potentials.find((p) => p.nodeID === e.target.value);
    node.setCopyFrom(org ?? null);
    updateWithSave();
  };

  return (
    <Box
      component="div"
      sx={{
        width: '100%',
        height: '100%'
      }}
    >
      <Box
        component="div"
        sx={{
          pb: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'start',
          width: '100%'
        }}
      >
        <Typography sx={{pr: 1}}>Copy from the original.</Typography>
        <NativeSelect
          native
          variant="standard"
          value={selectedCopyOrg}
          onChange={onOrgNodeSelected}
          sx={{minWidth: '200px', pl: 1}}
        >
          <option aria-label="None" value="" />
          {potentials.map((control) => (
            <option value={control.nodeID} key={control.nodeID}>
              {control.name}
            </option>
          ))}
        </NativeSelect>
      </Box>
      <Paper sx={{width: '100%', mb: 2}}>
        <EnhancedTableToolbar
          test={test}
          selected={selected}
          node={node}
          setSelected={setSelected}
        />
        <TableContainer>
          <Table sx={{minWidth: 750}} aria-labelledby="tableTitle" size="small">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
              copyFromOrg={!!node.copyFrom}
            />
            <TableBody>
              {rows
                .slice()
                .sort(getComparator(order, orderBy))
                .map((row, index) => {
                  const isItemSelected = isSelected(row.targetNodeID);
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                    <ExistingRow
                      onClick={handleClick}
                      node={node}
                      row={row}
                      test={test}
                      isItemSelected={isItemSelected}
                      labelId={labelId}
                      key={row.targetNodeID}
                    />
                  );
                })}

              {!node.copyFrom ? (
                <NewRow
                  node={node}
                  test={test}
                  updateWithSave={updateWithSave}
                  mode={mode}
                  key="new"
                />
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Row;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'Name'
  },
  {
    id: 'categories',
    numeric: true,
    disablePadding: true,
    label: 'Categories'
  },
  {
    id: 'startFormula',
    numeric: true,
    disablePadding: false,
    label: 'Start'
  },
  {
    id: 'endFormula',
    numeric: true,
    disablePadding: false,
    label: 'End'
  },
  {
    id: 'stepFormula',
    numeric: true,
    disablePadding: false,
    label: 'Step'
  },
  {
    id: 'startValue',
    numeric: true,
    disablePadding: false,
    label: 'Start'
  },
  {
    id: 'endValue',
    numeric: true,
    disablePadding: false,
    label: 'End'
  },
  {
    id: 'step',
    numeric: true,
    disablePadding: false,
    label: 'Step'
  }
];

function EnhancedTableHead(props: {
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Row
  ) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  copyFromOrg: boolean;
}) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    copyFromOrg,
    onRequestSort
  } = props;
  const createSortHandler =
    (property: keyof Row) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all desserts'
            }}
          />
        </TableCell>
        {copyFromOrg ? <TableCell padding="checkbox">Modify</TableCell> : null}
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function NewRow(props: {
  node: ISweepNode;
  mode: Mode;
  test: ITest;
  updateWithSave: () => void;
}) {
  const {updateWithSave, node, mode, test} = props;
  const labelId = React.useId();
  const [startValue, setStartValue] = React.useState<number | null>(null);
  const [endValue, setEndValue] = React.useState<number | null>(null);
  const [stepValue, setStepValue] = React.useState<number | null>(null);

  const [category, setCategory] = React.useState<SweeperType | ''>('');
  const [selectedObject, setSelectedObject] = React.useState<{
    type: SweeperType | 'NotSelected';
    target: string;
    valueForSelectTag: string;
  }>({type: 'NotSelected', target: '', valueForSelectTag: ''});

  const assemblyMode = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter(
    (c) =>
      (c.configuration ?? 'FixedFrame') === assemblyMode &&
      (test.calculateSteadyStateDynamics
        ? !c.disabledWhileDynamicSolverIsActive
        : true)
  );

  const formulae = useSelector(
    (state: RootState) => state.dgd.present.formulae
  ).map((f) => new Formula(f));

  const onStartFormulaValidated = (formula: string) => {
    setStartValue(new Formula(formula).evaluatedValue);
  };

  const onEndFormulaValidated = (formula: string) => {
    setEndValue(new Formula(formula).evaluatedValue);
  };

  const onStepFormulaValidated = (formula: string) => {
    setStepValue(new Formula(formula).evaluatedValue);
  };

  const reset = () => {
    setCategory('');
    setSelectedObject({type: 'NotSelected', target: '', valueForSelectTag: ''});
    setStartValue(null);
    setEndValue(null);
    setStepValue(null);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      startFormula: '',
      endFormula: '',
      stepFormula: ''
    },
    validationSchema: yup.object({
      startFormula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, onStartFormulaValidated),
      endFormula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, onEndFormulaValidated),
      stepFormula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, onStepFormulaValidated)
        .gdFormulaNonZero()
        .gdFormulaStepValid(startValue, endValue)
    }),
    onSubmit: (values) => {
      formik.resetForm();
      if (selectedObject.type === 'Control') {
        const control = controls.find(
          (c) =>
            c.nodeID === selectedObject.target &&
            (c.configuration ?? 'FixedFrame') === assemblyMode
        );
        if (!control) return;

        const setter = new ParameterSweeper({
          type: 'Control',
          target: control,
          mode,
          startFormula: values.startFormula,
          endFormula: values.endFormula,
          stepFormula: values.stepFormula
        });

        node.listSweepers.push(setter);
        updateWithSave();
        reset();
      } else if (selectedObject.type === 'GlobalVariable') {
        const formula = formulae.find((f) => f.name === selectedObject.target);
        if (!formula) return;

        const setter = new ParameterSweeper({
          type: 'GlobalVariable',
          target: formula,
          mode,
          startFormula: values.startFormula,
          endFormula: values.endFormula,
          stepFormula: values.stepFormula
        });

        node.listSweepers.push(setter);
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
    setStartValue(null);
    setEndValue(null);
    setStepValue(null);
    formik.handleChange(e);
  };

  const handleTargetChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    if (value.includes('@Control')) {
      const nodeID = value.split('@')[0];
      const control = controls.find(
        (c) =>
          c.nodeID === nodeID &&
          (c.configuration ?? 'FixedFrame') === assemblyMode
      );
      if (!control) return;
      setSelectedObject({
        type: 'Control',
        target: nodeID,
        valueForSelectTag: value
      });
      setCategory('Control');
    } else if (value.includes('@Formula')) {
      const nodeID = value.split('@')[0];
      const formula = formulae.find((f) => f.name === nodeID);
      if (!formula) return;
      setSelectedObject({
        type: 'GlobalVariable',
        target: nodeID,
        valueForSelectTag: value
      });
      setCategory('GlobalVariable');
    } else {
      setSelectedObject({
        type: 'NotSelected',
        target: '',
        valueForSelectTag: ''
      });
      setCategory('');
    }
  };

  const alreadyExistsInSetterList = node.listSweepers.map((s) => s.target);

  if (alreadyExistsInSetterList.length === controls.length) return null;

  return (
    <TableRow /* hover tabIndex={-1} */>
      <TableCell padding="checkbox">
        <Checkbox
          disabled
          color="primary"
          inputProps={{
            'aria-labelledby': labelId
          }}
        />
      </TableCell>
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
          <optgroup label="Formulae">
            {formulae
              .filter((f) => !alreadyExistsInSetterList.includes(f.name))
              .map((formula) => (
                <option value={`${formula.name}@Formula`} key={formula.name}>
                  {formula.name}
                </option>
              ))}
          </optgroup>
        </NativeSelect>
      </TableCell>
      <TableCell align="right" padding="none">
        {category}
      </TableCell>
      <TableCell align="right">
        <StandardTextField
          disabled={!selectedObject.valueForSelectTag}
          hiddenLabel
          name="startFormula"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={handleFormulaChange}
          value={formik.values.startFormula}
          error={
            formik.touched.startFormula &&
            formik.errors.startFormula !== undefined
          }
          helperText={formik.touched.startFormula && formik.errors.startFormula}
        />
      </TableCell>
      <TableCell align="right">
        <StandardTextField
          disabled={!selectedObject.valueForSelectTag}
          hiddenLabel
          name="endFormula"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={handleFormulaChange}
          value={formik.values.endFormula}
          error={
            formik.touched.endFormula && formik.errors.endFormula !== undefined
          }
          helperText={formik.touched.endFormula && formik.errors.endFormula}
        />
      </TableCell>
      <TableCell align="right">
        <StandardTextField
          disabled={!selectedObject.valueForSelectTag}
          hiddenLabel
          name="stepFormula"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={handleFormulaChange}
          value={formik.values.stepFormula}
          error={
            formik.touched.stepFormula &&
            formik.errors.stepFormula !== undefined
          }
          helperText={formik.touched.stepFormula && formik.errors.stepFormula}
        />
      </TableCell>

      <TableCell align="right">{toFixedNoZero(startValue)}</TableCell>
      <TableCell align="right">{toFixedNoZero(endValue)}</TableCell>
      <TableCell align="right">{toFixedNoZero(stepValue)}</TableCell>
    </TableRow>
  );
}

function ExistingRow(props: {
  node: ISweepNode;
  row: Row;
  test: ITest;
  isItemSelected: boolean;
  labelId: string;
  onClick: (targetNodeID: string) => void;
}) {
  const {node, row, test, onClick, isItemSelected, labelId} = props;

  const {updateWithSave} = useTestUpdate(test);

  const [startValue, setStartValue] = React.useState<number | null>(
    row.startValue
  );
  const [endValue, setEndValue] = React.useState<number | null>(row.endValue);
  const onStartFormulaValidated = (formula: string) => {
    setStartValue(new Formula(formula).evaluatedValue);
  };
  const onEndFormulaValidated = (formula: string) => {
    setEndValue(new Formula(formula).evaluatedValue);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      startFormula: row.startFormula,
      endFormula: row.endFormula,
      stepFormula: row.stepFormula
    },
    validationSchema: yup.object({
      startFormula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, onStartFormulaValidated, () =>
          setStartValue(null)
        ),
      endFormula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, onEndFormulaValidated, () =>
          setEndValue(null)
        ),
      stepFormula: yup
        .string()
        .required('')
        .gdFormulaIsValid(undefined, undefined, undefined)
        .gdFormulaNonZero()
        .gdFormulaStepValid(startValue, endValue)
    }),
    onSubmit: (values) => {
      formik.resetForm();
      if (row.categories === 'Control' || row.categories === 'GlobalVariable') {
        const sweeper = node.listSweepers.find(
          (s) => s.target === row.targetNodeID
        );
        if (!sweeper) return;
        sweeper.startFormula.formula = values.startFormula;
        sweeper.endFormula.formula = values.endFormula;
        sweeper.stepFormula.formula = values.stepFormula;
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
          onClick={() => onClick(row.targetNodeID)}
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
        <StandardTextField
          disabled={!!node.copyFrom && !node.isModRow[row.targetNodeID]}
          hiddenLabel
          name="startFormula"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={formik.handleChange}
          value={formik.values.startFormula}
          error={
            formik.touched.startFormula &&
            formik.errors.startFormula !== undefined
          }
          helperText={formik.touched.startFormula && formik.errors.startFormula}
        />
      </TableCell>
      <TableCell align="right">
        <StandardTextField
          disabled={!!node.copyFrom && !node.isModRow[row.targetNodeID]}
          hiddenLabel
          name="endFormula"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={formik.handleChange}
          value={formik.values.endFormula}
          error={
            formik.touched.endFormula && formik.errors.endFormula !== undefined
          }
          helperText={formik.touched.endFormula && formik.errors.endFormula}
        />
      </TableCell>
      <TableCell align="right">
        <StandardTextField
          disabled={!!node.copyFrom && !node.isModRow[row.targetNodeID]}
          hiddenLabel
          name="stepFormula"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={formik.handleChange}
          value={formik.values.stepFormula}
          error={
            formik.touched.stepFormula &&
            formik.errors.stepFormula !== undefined
          }
          helperText={formik.touched.stepFormula && formik.errors.stepFormula}
        />
      </TableCell>

      <TableCell align="right" sx={{color}}>
        {toFixedNoZero(row.startValue)}
      </TableCell>
      <TableCell align="right" sx={{color}}>
        {toFixedNoZero(row.endValue)}
      </TableCell>
      <TableCell align="right" sx={{color}}>
        {toFixedNoZero(row.step)}
      </TableCell>
    </TableRow>
  );
}

const EnhancedTableToolbar = (props: {
  test: ITest;
  node: ISweepNode;
  selected: readonly string[];
  setSelected: React.Dispatch<React.SetStateAction<readonly string[]>>;
}) => {
  const {test, node, selected, setSelected} = props;
  const {updateWithSave} = useTestUpdate(test);

  const onDeleteClick = () => {
    node.listSweepers = node.listSweepers.filter(
      (s) => !selected.includes(s.target)
    );
    setSelected([]);
    updateWithSave();
  };

  return (
    <Toolbar
      sx={{
        pl: {sm: 2},
        pr: {xs: 1, sm: 1},
        ...(selected.length > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            )
        })
      }}
    >
      {selected.length > 0 ? (
        <Typography
          sx={{flex: '1 1 100%'}}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {selected.length} selected
        </Typography>
      ) : (
        <Typography
          sx={{flex: '1 1 100%'}}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Parameters
        </Typography>
      )}
      {selected.length > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={onDeleteClick}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : null}
    </Toolbar>
  );
};

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: {[key in Key]: number | string},
  b: {[key in Key]: number | string}
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
