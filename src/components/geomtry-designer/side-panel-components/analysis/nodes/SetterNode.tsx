import * as React from 'react';
import {RootState} from '@store/store';
import {useSelector} from 'react-redux';
import {CardNodeProps} from '@gdComponents/side-panel-components/analysis/CardNode';
import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {
  className,
  ISetterNode,
  SetterNode,
  isSetterNode
} from '@gd/analysis/SetterNode';
import {Item, XYPosition} from '@gd/analysis/FlowNode';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import Typography from '@mui/material/Typography';
import {alpha} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import {visuallyHidden} from '@mui/utils';
import {getControl} from '@gd/controls/Controls';
import {useFormik} from 'formik';
import yup from '@app/utils/Yup';
import TextField from '@mui/material/TextField';
import {toFixedNoZero} from '@utils/helpers';
import {Formula} from '@gd/Formula';
import useTestUpdate from '@hooks/useTestUpdate';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import {SetterType, ParameterSetter} from '@gd/analysis/ParameterSetter';
import Tuning from '@gdComponents/svgs/Tuning';
import {getRFNodeBase} from './Base';

export {isSetterNode};

export function getRFNode(
  node: ISetterNode,
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
      useDialog: () => useSetterDialog({node, test, canvasUpdate})
    }
  };
}

export function getItem(): Item {
  return {
    className,
    icon: <Tuning title="Setter" />,
    text: 'Set parameters',
    onDrop: (position: XYPosition, temporary: boolean) =>
      new SetterNode({
        name: 'Parameter setting',
        position,
        nodeID: temporary ? 'temp' : undefined
      })
  };
}

function useSetterDialog(props: {
  node: ISetterNode;
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
      >
        <SetterContent node={node} test={test} />
      </FlowNodeDialog>
    ) : null,
    setOpen
  ];
}

interface Row {
  targetNodeID: string;
  name: string;
  categories: string;
  valueFormula: string;
  evaluatedValue: number;
}

function SetterContent(props: {node: ISetterNode; test: ITest}) {
  const {node, test} = props;
  const {updateWithSave} = useTestUpdate(test);
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Row>('name');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const rows = node.listSetters.map(
    (setter): Row => ({
      targetNodeID: setter.target,
      name: setter.name,
      categories: setter.type,
      valueFormula: setter.valueFormula.formula,
      evaluatedValue: setter.evaluatedValue
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
      isSetterNode(n) && n.nodeID !== node.nodeID && n.copyFrom === undefined
  ) as ISetterNode[];

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
                <NewRow node={node} updateWithSave={updateWithSave} key="new" />
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
    id: 'valueFormula',
    numeric: true,
    disablePadding: false,
    label: 'Value'
  },
  {
    id: 'evaluatedValue',
    numeric: true,
    disablePadding: false,
    label: 'Evaluated Value'
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
    onRequestSort,
    copyFromOrg
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
            disabled={copyFromOrg}
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

  const assemblyMode = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter((c) => (c.configuration ?? 'FixedFrame') === assemblyMode);

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
          (c) =>
            c.nodeID === selectedObject.target &&
            (c.configuration ?? 'FixedFrame') === assemblyMode
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

const EnhancedTableToolbar = (props: {
  test: ITest;
  node: ISetterNode;
  selected: readonly string[];
  setSelected: React.Dispatch<React.SetStateAction<readonly string[]>>;
}) => {
  const {test, node, selected, setSelected} = props;
  const {updateWithSave} = useTestUpdate(test);

  const onDeleteClick = () => {
    node.listSetters = node.listSetters.filter(
      (setter) => !selected.includes(setter.target)
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
  a: {[key in Key]: number | string | boolean},
  b: {[key in Key]: number | string | boolean}
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
