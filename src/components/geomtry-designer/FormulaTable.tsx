import * as React from 'react';
import TableCellOrg, {tableCellClasses} from '@mui/material/TableCell';
import {styled} from '@mui/material/styles';
import TableHeadOrg from '@mui/material/TableHead';
import TableRowOrg from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import {visuallyHidden} from '@mui/utils';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

export const TableCell = styled(TableCellOrg)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#333',
    color: '#FFF'
  },
  [`.MuiTableSortLabel-root`]: {
    color: '#FFF!important'
  },
  [`.MuiTableSortLabel-icon`]: {
    color: '#FFF!important'
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14
  }
}));

export const TableRow = styled(TableRowOrg)(() => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#ddd'
  },
  '&:last-child td': {
    opacity: 0.3
  },
  '&:focus-within': {
    '&:last-child td': {
      opacity: 1
    }
  }
}));

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export type Order = 'asc' | 'desc';

export function getComparator<Key extends keyof any>(
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

export interface HeadCell<Data> {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  align: 'right' | 'left';
}

interface TableProps<Data> {
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  readonly headCells: HeadCell<Data>[];
}

export function TableHead<Data>(props: TableProps<Data>) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    headCells,
    onRequestSort
  } = props;
  const createSortHandler =
    (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHeadOrg>
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
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id as string}
            align={headCell.align}
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
    </TableHeadOrg>
  );
}
