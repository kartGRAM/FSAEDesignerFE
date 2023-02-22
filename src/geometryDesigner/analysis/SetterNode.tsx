/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import * as React from 'react';
import {Node as IRFNode, XYPosition} from 'reactflow';
import Tuning from '@gdComponents/svgs/Tuning';
import {v4 as uuidv4} from 'uuid';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import {CardNodeProps} from '@gdComponents/side-panel-components/analysis/CardNode';
import {alpha} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import {visuallyHidden} from '@mui/utils';
import store from '@store/store';
import {getControl, Control} from '@gd/controls/Controls';
import {ITest} from './ITest';
import {
  isStartNode,
  isAssemblyControlNode,
  isCaseControlNode
} from './TypeGuards';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  Item,
  IDataEdge
} from './FlowNode';
import {
  IParameterSetter,
  IDataParameterSetter,
  ParameterSetter
} from './ParameterSetter';

const className = 'Setter' as const;
type ClassName = typeof className;

export interface ISetterNode extends IActionNode {
  className: ClassName;
  listSetters: IParameterSetter[];
}

export interface IDataSetterNode extends IDataActionNode {
  className: ClassName;
  listSetters: IDataParameterSetter[];
}

export class SetterNode extends ActionNode implements ISetterNode {
  action(): void {}

  readonly className = className;

  listSetters: IParameterSetter[];

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (
      isStartNode(node) ||
      isAssemblyControlNode(node) ||
      isCaseControlNode(node)
    )
      return true;
    return false;
  }

  getData(): IDataSetterNode {
    const data = super.getData();
    return {
      ...data,
      className: this.className,
      listSetters: this.listSetters.map((setter) => setter.getData())
    };
  }

  getRFNode(test: ITest, canvasUpdate?: () => void): IRFNode & CardNodeProps {
    const rfNode = super.getRFNode(test, canvasUpdate);
    return {
      ...rfNode,
      type: 'card',
      data: {
        label: this.name,
        source: true,
        target: true,
        useDialog: () => useSetterDialog({node: this, test, canvasUpdate})
      }
    };
  }

  static getItem(): Item {
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

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataSetterNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    this.listSetters = [];
    if (isDataFlowNode(params) && isDataSetterNode(params)) {
      const data = params;
      if (data.listSetters)
        this.listSetters = data.listSetters.map(
          (setterData) => new ParameterSetter(setterData)
        );
    }
  }

  clone(): ISetterNode {
    return new SetterNode({...this.getData(), nodeID: uuidv4()});
  }
}

export function isSetterNode(node: IFlowNode): node is ISetterNode {
  return node.className === className;
}

export function isDataSetterNode(node: IDataFlowNode): node is IDataSetterNode {
  return node.className === className;
}

function useSetterDialog(props: {
  node: SetterNode;
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
  valueFormula: number;
  evaluatedValue: number;
}

function SetterContent(props: {node: ISetterNode; test: ITest}) {
  const {node, test} = props;
  const controls = store
    .getState()
    .dgd.present.controls.reduce((prev, current) => {
      prev[current.nodeID] = getControl(current);
      return prev;
    }, {} as {[index: string]: Control});
  const rowHeight = 33;

  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Row>('name');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [page, setPage] = React.useState(0);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const rows = Math.floor((boxRef.current!.clientHeight - 140) / rowHeight);
      setRowsPerPage(rows);
      setPage(0);
    });
    resizeObserver.observe(boxRef.current!);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  const rows = node.listSetters.map(
    (setter): Row => ({
      targetNodeID: setter.targetNodeID,
      name: '',
      categories: setter.type,
      valueFormula: 0,
      evaluatedValue: 0
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

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <Box
      component="div"
      sx={{
        width: '100%',
        height: '100%'
      }}
      ref={boxRef}
    >
      <Paper sx={{width: '100%', mb: 2}}>
        <EnhancedTableToolbar numSelected={selected.length} />
        <TableContainer>
          <Table sx={{minWidth: 750}} aria-labelledby="tableTitle" size="small">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {rows
                .slice()
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.name);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.name)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.name}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          inputProps={{
                            'aria-labelledby': labelId
                          }}
                        />
                      </TableCell>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        padding="none"
                      >
                        {row.name}
                      </TableCell>
                      <TableCell align="right">{row.categories}</TableCell>
                      <TableCell align="right">{row.valueFormula}</TableCell>
                      <TableCell align="right">{row.evaluatedValue}</TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: rowHeight * emptyRows
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
          page={page}
          onPageChange={handleChangePage}
        />
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
    label: 'name'
  },
  {
    id: 'categories',
    numeric: true,
    disablePadding: false,
    label: 'categories'
  },
  {
    id: 'valueFormula',
    numeric: true,
    disablePadding: false,
    label: 'value'
  },
  {
    id: 'evaluatedValue',
    numeric: true,
    disablePadding: false,
    label: 'Carbs (g)'
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
}) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
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

const EnhancedTableToolbar = (props: {numSelected: number}) => {
  const {numSelected} = props;

  return (
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
        <Typography
          sx={{flex: '1 1 100%'}}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Nutrition
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton>
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
