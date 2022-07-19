import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setFormulaDialogOpen} from '@store/reducers/uiTempGeometryDesigner';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import {Formula} from '@gd/Formula';
// import TablePagination from '@mui/material/TablePagination';
import {
  Order,
  TableCell,
  TableRow,
  TableHead,
  TableToolbar,
  HeadCell,
  getComparator
} from '@gdComponents/FormulaTable';
import Input from '@mui/material/Input';
import TextField from '@mui/material/TextField';

import {useFormik} from 'formik';
import yup from '@app/utils/Yup';

interface Data {
  name: string;
  formula: string;
  evaluatedValue: number;
  absPath: string;
}

const headCells: HeadCell<Data>[] = [
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
}

function TableRowExistingFormula(props: TableRowExistingFormulaProps) {
  const {row, selected, setSelected} = props;
  const isItemSelected = selected.includes(row.name);

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
      <TableCell id={labelId} scope="row" padding="none">
        <Input value={row.name} />
      </TableCell>
      <TableCell align="right">
        <Input value={row.formula} />
      </TableCell>
      <TableCell align="right">{row.evaluatedValue}</TableCell>
      <TableCell align="right">{row.absPath}</TableCell>
    </TableRow>
  );
}

function TableRowNewFormula() {
  const labelId = React.useId();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: '',
      formula: ''
    },
    validationSchema: yup.object({
      name: yup.string().required('Required').gdVariableNameMustBeUnique(),
      formula: yup.string().required('Required')
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSubmit: (values) => {}
  });

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
      <TableCell id={labelId} scope="row" padding="none">
        <TextField
          hiddenLabel
          name="name"
          variant="standard"
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
          value={formik.values.name}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />
      </TableCell>
      <TableCell align="right">
        <Input value="" />
      </TableCell>
      <TableCell align="right" />
      <TableCell align="right" />
    </TableRow>
  );
}

export function FormulaDialog() {
  const formulaDialogOpen: boolean = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.formulaDialogOpen
  );
  const dispatch = useDispatch();

  const zIndex = useSelector(
    (state: RootState) => state.uitgd.fullScreenZIndex + 10000
  );

  const formulae = useSelector(
    (state: RootState) => state.dgd.present.formulae
  );
  const rows = formulae.map((formula) => new Formula(formula));

  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Data>('name');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rowsPerPage, setRowsPerPage] = React.useState(Number.MAX_SAFE_INTEGER);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = React.useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClose = (e: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
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

  return (
    <Dialog
      sx={{
        backdropFilter: 'blur(3px)',
        zIndex: `${zIndex}!important`
      }}
      onClose={handleClose}
      open={formulaDialogOpen}
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
        <TableToolbar numSelected={selected.length} />
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
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .sort(getComparator(order, orderBy))
                .map((row) => (
                  <TableRowExistingFormula
                    row={row}
                    selected={selected}
                    setSelected={setSelected}
                  />
                ))}
              <TableRowNewFormula />
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
        <Button>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
