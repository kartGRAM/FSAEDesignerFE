import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog, {DialogProps} from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setFormulaDialogOpen} from '@store/reducers/uiTempGeometryDesigner';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number
) {
  return {name, calories, fat, carbs, protein};
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9)
];

export function FormulaDialog(props: DialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formulaDialogOpen: boolean = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.formulaDialogOpen
  );
  const dispatch = useDispatch();
  const {onClose} = props;

  const handleClose = (e: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (onClose) onClose(e, reason);
    dispatch(setFormulaDialogOpen({open: false}));
  };

  return (
    <Dialog {...props} onClose={handleClose} open={formulaDialogOpen}>
      <DialogTitle>Set backup account</DialogTitle>
      <TableContainer component={Paper}>
        <Table sx={{minWidth: 650}} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>Dessert (100g serving)</TableCell>
              <TableCell align="right">Calories</TableCell>
              <TableCell align="right">Fat&nbsp;(g)</TableCell>
              <TableCell align="right">Carbs&nbsp;(g)</TableCell>
              <TableCell align="right">Protein&nbsp;(g)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.name}
                sx={{'&:last-child td, &:last-child th': {border: 0}}}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell align="right">{row.calories}</TableCell>
                <TableCell align="right">{row.fat}</TableCell>
                <TableCell align="right">{row.carbs}</TableCell>
                <TableCell align="right">{row.protein}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Dialog>
  );
}
