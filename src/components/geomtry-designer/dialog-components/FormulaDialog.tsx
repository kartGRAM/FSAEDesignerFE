import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setFormulaDialogOpen} from '@store/reducers/uiTempGeometryDesigner';
import {setFormulae} from '@store/reducers/dataGeometryDesigner';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {evaluate, validate} from '@gd/Formula';
import {
  validateAll,
  getAllEvaluatedValue,
  IDataFormula,
  hasName,
  replaceName
} from '@gd/IFormula';
import {toFixedNoZero} from '@app/utils/helpers';

// import TablePagination from '@mui/material/TablePagination';
import {
  Order,
  TableCell,
  TableRow,
  TableHead,
  HeadCell,
  getComparator
} from '@gdComponents/FormulaTable';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {alpha} from '@mui/material/styles';

import Toolbar from '@mui/material/Toolbar';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import {useFormik} from 'formik';
import yup from '@app/utils/Yup';

interface Data {
  name: string;
  formula: string;
  evaluatedValue: number;
  absPath: string;
  id: number;
}

const createData = (formulae: IDataFormula[]): Data[] => {
  try {
    const values = getAllEvaluatedValue(formulae);
    return formulae.map(
      (formula, i): Data => ({
        id: i + 1,
        name: formula.name,
        formula: formula.formula,
        evaluatedValue: values[formula.name],
        absPath: formula.absPath
      })
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return [];
  }
};

const updateRowsValue = (rows: Data[]) => {
  try {
    const values = getAllEvaluatedValue(rows);
    return rows.map((row) => ({
      ...row,
      evaluatedValue: values[row.name]
    }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return [];
  }
};

const headCells: HeadCell<Data>[] = [
  {
    id: 'id',
    disablePadding: false,
    label: 'No.',
    align: 'left'
  },
  {
    id: 'name',
    disablePadding: true,
    label: 'Variable Name',
    align: 'left'
  },
  {
    id: 'formula',
    disablePadding: false,
    label: 'Formula',
    align: 'left'
  },
  {
    id: 'evaluatedValue',
    disablePadding: false,
    label: 'Evaluated Value',
    align: 'right'
  },
  {
    id: 'absPath',
    disablePadding: false,
    label: 'Path',
    align: 'right'
  }
];

interface TableRowExistingFormulaProps {
  row: Data;
  selected: readonly string[];
  setSelected: React.Dispatch<React.SetStateAction<readonly string[]>>;
  setRows: React.Dispatch<React.SetStateAction<Data[]>>;
  rows: Data[];
}

function TableRowExistingFormula(props: TableRowExistingFormulaProps) {
  const {row, selected, setSelected, rows, setRows} = props;
  const isItemSelected = selected.includes(row.name);

  const nameRef = React.useRef<HTMLInputElement>(null);
  const formulaRef = React.useRef<HTMLInputElement>(null);
  const [evaluatedValue, setEvaluatedValue] = React.useState<number | null>(
    row.evaluatedValue
  );
  React.useEffect(() => {
    setEvaluatedValue(row.evaluatedValue);
  }, [row.evaluatedValue]);

  const onFormulaValidated = (formula: string) => {
    setEvaluatedValue(evaluate(formula, rows));
  };

  const schema = yup.lazy((values) =>
    yup.object({
      name: yup
        .string()
        .required('')
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName()
        .gdVariableNameMustBeUnique(rows, row.name),
      formula: yup
        .string()
        .required('')
        .gdFormulaIsValid(rows, values.name, onFormulaValidated)
    })
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: row.name,
      formula: row.formula
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const effectedRows: Data[] = [];
      if (row.name !== values.name) {
        rows.forEach((r) => {
          if (hasName(r.formula, row.name)) {
            const newFormula = replaceName(r.formula, row.name, values.name);
            effectedRows.push({
              ...r,
              formula: newFormula
            });
          }
        });
      }
      const effectedRowsIDs = effectedRows.map((row) => row.id);
      const newRows = [
        ...rows.filter(
          (r) => r.id !== row.id && !effectedRowsIDs.includes(r.id)
        ),
        {
          id: row.id,
          name: values.name,
          formula: values.formula,
          evaluatedValue: evaluate(values.formula, rows),
          absPath: 'global'
        },
        ...effectedRows
      ];
      newRows.sort((a, b) => a.id - b.id);
      const ret = validateAll(newRows);
      if (ret === 'OK') setRows(newRows);
      else reset();
    }
  });

  const reset = () => {
    formik.resetForm();
  };

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      setEvaluatedValue(null);
      formik.handleSubmit();
      if (nameRef.current) {
        if (formik.errors.formula !== undefined && formulaRef.current) {
          formulaRef.current.focus();
        } else if (formik.errors.name !== undefined) {
          nameRef.current.focus();
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvaluatedValue(null);
    formik.handleChange(e);
  };

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((n) => n !== name));
    } else {
      setSelected([...selected, name]);
    }
  };
  const labelId = React.useId();

  return (
    <TableRow hover tabIndex={-1} key={row.name}>
      <TableCell padding="checkbox">
        <Checkbox
          onClick={(event) => handleClick(event, row.name)}
          color="primary"
          checked={isItemSelected}
          inputProps={{
            'aria-labelledby': labelId
          }}
        />
      </TableCell>
      <TableCell align="left">{row.id}</TableCell>
      <TableCell id={labelId} scope="row" padding="none">
        <TextField
          inputRef={nameRef}
          autoFocus
          hiddenLabel
          name="name"
          variant="standard"
          onBlur={formik.handleBlur}
          onKeyDown={onEnter}
          onChange={formik.handleChange}
          value={formik.values.name}
          error={
            formik.touched.name && Boolean(formik.errors.name !== undefined)
          }
          helperText={formik.touched.name && formik.errors.name}
        />
      </TableCell>
      <TableCell align="right">
        <TextField
          inputRef={formulaRef}
          hiddenLabel
          name="formula"
          variant="standard"
          onBlur={formik.handleBlur}
          onKeyDown={onEnter}
          onChange={handleChange}
          value={formik.values.formula}
          error={formik.touched.formula && formik.errors.formula !== undefined}
          helperText={formik.touched.formula && formik.errors.formula}
        />
      </TableCell>
      <TableCell align="right">{toFixedNoZero(evaluatedValue)}</TableCell>
      <TableCell align="right">{row.absPath}</TableCell>
    </TableRow>
  );
}

interface TableRowNewFormulaProps {
  setRows: React.Dispatch<React.SetStateAction<Data[]>>;
  rows: Data[];
}

function TableRowNewFormula(props: TableRowNewFormulaProps) {
  const {rows, setRows} = props;
  const labelId = React.useId();
  const nameRef = React.useRef<HTMLInputElement>(null);
  const formulaRef = React.useRef<HTMLInputElement>(null);
  const [evaluatedValue, setEvaluatedValue] = React.useState<number | null>(
    null
  );

  const onFormulaValidated = (formula: string) => {
    setEvaluatedValue(evaluate(formula, rows));
  };

  const schema = yup.lazy((values) =>
    yup.object({
      name: yup
        .string()
        .required('')
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName()
        .gdVariableNameMustBeUnique(rows),
      formula: yup
        .string()
        .required('')
        .gdFormulaIsValid(rows, values.name, onFormulaValidated)
    })
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: '',
      formula: ''
    },
    validationSchema: schema,
    onSubmit: (values) => {
      formik.resetForm();
      setRows((prevState) => [
        ...prevState,
        {
          id: rows.length + 1,
          name: values.name,
          formula: values.formula,
          evaluatedValue: evaluate(values.formula, rows),
          absPath: 'global'
        }
      ]);
      setTimeout(() => setEvaluatedValue(null), 0);
    }
  });

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
      if (nameRef.current) {
        if (formik.errors.formula !== undefined && formulaRef.current) {
          formulaRef.current.focus();
        } else {
          nameRef.current.focus();
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvaluatedValue(null);
    formik.handleChange(e);
  };

  return (
    <TableRow hover tabIndex={-1} key="newRow">
      <TableCell padding="checkbox">
        <Checkbox
          disabled
          color="primary"
          inputProps={{
            'aria-labelledby': labelId
          }}
        />
      </TableCell>
      <TableCell align="left" />
      <TableCell id={labelId} scope="row" padding="none">
        <TextField
          inputRef={nameRef}
          autoFocus
          hiddenLabel
          name="name"
          variant="standard"
          onBlur={formik.handleBlur}
          onKeyDown={onEnter}
          onChange={formik.handleChange}
          value={formik.values.name}
          error={
            formik.touched.name && Boolean(formik.errors.name !== undefined)
          }
          helperText={formik.touched.name && formik.errors.name}
        />
      </TableCell>
      <TableCell align="right">
        <TextField
          inputRef={formulaRef}
          hiddenLabel
          name="formula"
          variant="standard"
          onBlur={formik.handleBlur}
          onKeyDown={onEnter}
          onChange={handleChange}
          value={formik.values.formula}
          error={formik.touched.formula && formik.errors.formula !== undefined}
          helperText={formik.touched.formula && formik.errors.formula}
        />
      </TableCell>
      <TableCell align="right">{toFixedNoZero(evaluatedValue)}</TableCell>
      <TableCell align="right" />
    </TableRow>
  );
}

type OnDeleteDialogProps = {
  name: string;
  zindex: number;
  onClose: (value: {ret: string; newValue: number}) => void;
  value: number;
};

export default function OnDeleteDialog(props: OnDeleteDialogProps) {
  const {zindex, onClose, name, value} = props;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      newValue: value
    },
    validationSchema: yup.object({
      newValue: yup.number().required()
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSubmit: (values) => {
      onClose({ret: 'ok', newValue: values.newValue});
    }
  });

  return (
    <Dialog
      open
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={{
        zIndex: `${zindex}!important`,
        backdropFilter: 'blur(3px)'
      }}
    >
      <DialogTitle>{`${name} is used in other formulae.`}</DialogTitle>
      <DialogContent>
        <DialogContentText>Replace with a constant value.</DialogContentText>

        <TextField
          autoFocus
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          label="Value"
          name="newValue"
          variant="standard"
          value={formik.values.newValue}
          error={formik.touched.newValue && Boolean(formik.errors.newValue)}
          helperText={formik.touched.newValue && formik.errors.newValue}
          margin="dense"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => formik.handleSubmit()} key="Replace">
          Replace
        </Button>
        <Button
          autoFocus
          key="Cancel"
          onClick={() => onClose({ret: 'cancel', newValue: Number.NaN})}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface TableToolbarProps {
  numSelected: number;
  zindex: number;
  selectedRows: Data[];
  rows: Data[];
  setRows: React.Dispatch<React.SetStateAction<Data[]>>;
  resetSelected: () => void;
}

const TableToolbar = (props: TableToolbarProps) => {
  const {numSelected, selectedRows, rows, setRows, zindex, resetSelected} =
    props;
  const [dialogProps, setDialogProps] = React.useState<
    OnDeleteDialogProps | undefined
  >(undefined);

  const handleDelete = () => {
    const confirm = async () => {
      const deleted: number[] = [];
      for (const row of selectedRows) {
        const rowsUsingDisposingValiable = rows.filter((r) =>
          hasName(r.formula, row.name)
        );
        if (rowsUsingDisposingValiable.length > 0) {
          // eslint-disable-next-line no-await-in-loop
          const {ret, newValue} = await new Promise<{
            ret: string;
            newValue: number;
          }>((resolve) => {
            setDialogProps({
              zindex: zindex + 1,
              onClose: resolve,
              name: row.name,
              value: row.evaluatedValue
            });
          });
          setDialogProps(undefined);
          if (ret === 'ok') {
            rowsUsingDisposingValiable.forEach((r) => {
              r.formula = replaceName(r.formula, row.name, newValue.toString());
            });

            deleted.push(row.id);
          }
        } else {
          deleted.push(row.id);
        }
      }
      const newRowsDeleted = rows
        .filter((row) => !deleted.includes(row.id))
        .sort((a, b) => a.id - b.id);
      const newRows = newRowsDeleted.map((row, i) => ({...row, id: i + 1}));
      const ret = validateAll(newRows);
      if (ret === 'OK') {
        setRows(newRows);
        resetSelected();
      }
    };
    confirm();
  };

  const handleSwap = () => {
    const tmpId = selectedRows[0].id;
    selectedRows[0].id = selectedRows[1].id;
    selectedRows[1].id = tmpId;
    const newRowsWOSelected = rows.filter(
      (row) => row.id !== selectedRows[0].id && row.id !== selectedRows[1].id
    );
    const newRows = [...selectedRows, ...newRowsWOSelected].sort(
      (a, b) => a.id - b.id
    );
    setRows(newRows);
  };

  return (
    <>
      <Toolbar
        sx={{
          pl: {sm: 2},
          pr: {xs: 1, sm: 1},
          ...(numSelected > 0 && {
            bgcolor: (theme) =>
              alpha(
                theme.palette.primary.main,
                theme.palette.action.activatedOpacity
              )
          })
        }}
      >
        {numSelected > 0 ? (
          <Typography
            sx={{flex: '1 1 100%'}}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        ) : (
          <Typography sx={{flex: '1 1 100%'}} variant="h6" component="div">
            Fomulae & Global Variables
          </Typography>
        )}
        {numSelected === 2 ? (
          <Tooltip title="Swap">
            <IconButton onClick={handleSwap}>
              <SwapVertIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </Toolbar>
      {dialogProps ? <OnDeleteDialog {...dialogProps} /> : null}
    </>
  );
};

export function FormulaDialog() {
  const open: boolean = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.formulaDialogOpen
  );
  const dispatch = useDispatch();

  const zIndex = useSelector(
    (state: RootState) => state.uitgd.fullScreenZIndex + 10000
  );

  const formulae = useSelector(
    (state: RootState) => state.dgd.present.formulae
  );
  const [stateRows, setRows] = React.useState<Data[]>(createData(formulae));
  const rows = updateRowsValue(stateRows);
  React.useEffect(() => {
    setRows(createData(formulae));
  }, [formulae, open]);

  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Data>('id');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rowsPerPage, setRowsPerPage] = React.useState(Number.MAX_SAFE_INTEGER);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = React.useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClose = (e: any, reason?: 'backdropClick' | 'escapeKeyDown') => {
    dispatch(setFormulaDialogOpen({open: false}));
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(rows.map((n) => n.name));
    } else {
      setSelected([]);
    }
  };

  const handleApply = () => {
    const ret = validateAll(rows);
    if (ret === 'OK') {
      dispatch(setFormulae(rows));
    }
    return ret;
  };

  const handleOK = () => {
    if (handleApply() === 'OK') {
      dispatch(setFormulaDialogOpen({open: false}));
    }
  };

  /*
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }; */

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const selectedRows = rows.filter((row) => selected.includes(row.name));

  return (
    <Dialog
      sx={{
        backdropFilter: 'blur(3px)',
        zIndex: `${zIndex}!important`
      }}
      open={open}
      maxWidth={false}
    >
      <DialogContent
        sx={{
          P: {
            marginTop: '1rem!important',
            marginBottom: '1rem!important'
          }
        }}
      >
        <TableToolbar
          rows={rows}
          zindex={zIndex}
          numSelected={selected.length}
          selectedRows={selectedRows}
          setRows={setRows}
          resetSelected={() => {
            setSelected([]);
          }}
        />
        <TableContainer>
          <Table
            sx={{minWidth: 750}}
            size="small"
            stickyHeader
            aria-label="sticky table"
          >
            <TableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
              headCells={headCells}
            />
            <TableBody>
              {rows
                ? rows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .sort(getComparator(order, orderBy))
                    .map((row) => (
                      <TableRowExistingFormula
                        row={row}
                        rows={rows}
                        setRows={setRows}
                        selected={selected}
                        setSelected={setSelected}
                        key={row.name}
                      />
                    ))
                : null}
              <TableRowNewFormula rows={rows} setRows={setRows} />
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 33 * emptyRows
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* <TablePagination
          rowsPerPageOptions={[20, 50, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          SelectProps={{
            MenuProps: {
              sx: {
                zIndex: `${zIndex + 1}!important`
              }
            }
          }}
        /> */}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleApply}>Apply</Button>
        <Button onClick={handleOK}>OK</Button>
        <Button onClick={(e) => handleClose(e)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
