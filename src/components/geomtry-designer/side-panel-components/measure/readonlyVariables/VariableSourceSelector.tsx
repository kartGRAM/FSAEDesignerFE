import * as React from 'react';
import store from '@store/store';
import Typography from '@mui/material/Typography';
import {alpha} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import {useFormik} from 'formik';
import yup from '@app/utils/Yup';
import TextField from '@mui/material/TextField';
import {toFixedNoZero} from '@utils/helpers';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import {
  IVariableSource,
  IReadonlyVariable,
  isReadonlyVariable,
  IDataVariableSource
} from '@gd/measure/readonlyVariables/IReadonlyVariable';
import {
  VariableSource,
  ReadonlyVariable
} from '@gd/measure/readonlyVariables/ReadonlyVariable';
import {isElement} from '@gd/IElements';
import {isMeasureTool} from '@gd/measure/measureTools/IMeasureTools';
import useUpdate from '@hooks/useUpdate';

export function VariableSourceSelector(props: {
  roVariable: IReadonlyVariable;
  selectableVariables: IReadonlyVariable[];
  setApplyReady: (variable: IReadonlyVariable) => void;
}) {
  const {roVariable, setApplyReady, selectableVariables} = props;

  const [selected, setSelected] = React.useState<readonly number[]>([]);
  const rows = roVariable.sources.map((s, i) => ({source: s, orgIndex: i}));

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((r) => r.orgIndex);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else {
      newSelected = selected.filter((i) => i !== id);
    }
    setSelected(newSelected);
  };

  const isSelected = (id: number) => selected.includes(id);

  const newRow = new VariableSource({source: null, target: '', name: 'x'});

  return (
    <Box
      component="div"
      sx={{
        width: '100%',
        height: '100%'
      }}
    >
      <Paper sx={{width: '100%', mb: 2}}>
        <MyTableToolbar
          selected={selected}
          variable={roVariable}
          setSelected={setSelected}
          setApplyReady={setApplyReady}
        />
        <TableContainer>
          <Table sx={{minWidth: 750}} aria-labelledby="tableTitle" size="small">
            <MyTableHead
              numSelected={selected.length}
              onSelectAllClick={handleSelectAllClick}
              rowCount={rows.length}
            />
            <TableBody>
              {rows.map((row) => {
                return (
                  <Row
                    id={row.orgIndex}
                    variableSource={row.source}
                    selected={isSelected(row.orgIndex)}
                    onClick={handleClick}
                    setApplyReady={() =>
                      setApplyReady(new ReadonlyVariable().copy(roVariable))
                    }
                    selectableVariables={selectableVariables}
                    key={row.orgIndex}
                  />
                );
              })}
              <Row
                id={-1}
                variableSource={newRow}
                selected={false}
                onClick={() => {}}
                setApplyReady={() => {
                  roVariable.sources.push(newRow);
                  setApplyReady(new ReadonlyVariable().copy(roVariable));
                }}
                selectableVariables={selectableVariables}
                key={-1}
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

interface HeadCell {
  disablePadding: boolean;
  id: 'name' | 'sourceCategory' | 'source' | 'targetNodeID' | 'value';
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'Alias'
  },
  {
    id: 'sourceCategory',
    numeric: false,
    disablePadding: true,
    label: 'Category'
  },
  {
    id: 'source',
    numeric: false,
    disablePadding: true,
    label: 'Source'
  },
  {
    id: 'targetNodeID',
    numeric: false,
    disablePadding: true,
    label: 'Formal name'
  },
  {
    id: 'value',
    numeric: true,
    disablePadding: false,
    label: 'Value'
  }
];

type SourceType = IDataVariableSource['sourceFrom'] | '';

function Row(props: {
  id: number;
  variableSource: IVariableSource;
  selected: boolean;
  onClick: (id: number) => void;
  setApplyReady: () => void;
  selectableVariables: IReadonlyVariable[];
}) {
  const {
    id,
    variableSource,
    selected,
    onClick,
    setApplyReady,
    selectableVariables
  } = props;

  const update = useUpdate();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      alias: variableSource.name
    },
    validationSchema: yup.object({
      alias: yup
        .string()
        .required('')
        .variableName()
        .noMathFunctionsName()
        .gdVariableNameMustBeUnique()
    }),
    onSubmit: (values) => {
      variableSource.name = values.alias;
      update();
      setApplyReady();
    }
  });

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  let categoryOrg: SourceType = '';
  if (isElement(variableSource.source)) categoryOrg = 'element';
  else if (isReadonlyVariable(variableSource.source))
    categoryOrg = 'readonlyVariable';
  else if (isMeasureTool(variableSource.source)) categoryOrg = 'measureTool';

  const [category, setCategory] = React.useState<SourceType>(categoryOrg);

  const handleCategoryChanged = (e: SelectChangeEvent<SourceType>) => {
    setCategory(e.target.value as any);
  };

  let sourceCandidates: {
    name: string;
    nodeID: string;
    source: IVariableSource['source'];
  }[] = [];
  if (category === 'element') {
    const elements = store.getState().uitgd.assembly?.flatten(false);
    if (elements) {
      sourceCandidates = elements.map((e) => ({
        name: e.name.value,
        nodeID: e.nodeID,
        source: e
      }));
    }
  } else if (category === 'measureTool') {
    const tools = store.getState().uitgd.measureToolsManager?.children;
    if (tools) {
      sourceCandidates = tools.map((e) => ({
        name: e.name,
        nodeID: e.nodeID,
        source: e
      }));
    }
  } else if (category === 'readonlyVariable') {
    sourceCandidates = selectableVariables.map((e) => ({
      name: e.name,
      nodeID: e.nodeID,
      source: e
    }));
  }
  const sourceSelected =
    sourceCandidates.find((s) => s.nodeID === variableSource.source?.nodeID)
      ?.nodeID ?? '';

  const handleSourceChanged = (e: SelectChangeEvent<string>) => {
    const nodeID = e.target.value;
    const newSource = sourceCandidates.find((s) => s.nodeID === nodeID)?.source;
    if (newSource) {
      variableSource.source = newSource;
      update();
      setApplyReady();
    }
  };

  let targetCandidates: {name: string; id: string}[] = [];
  if (isElement(variableSource.source)) {
    targetCandidates = variableSource.source.getVariables().map((v) => ({
      name: v.name,
      id: v.nodeID
    }));
  } else if (isMeasureTool(variableSource.source)) {
    targetCandidates = Object.keys(variableSource.source.value).map((v) => ({
      name: v,
      id: v
    }));
  }

  const targetSelected =
    targetCandidates.find((t) => t.id === variableSource.target)?.id ?? '';

  const handleTargetChanged = (e: SelectChangeEvent<string>) => {
    const id = e.target.value;
    const newTarget = targetCandidates.find((t) => t.id === id);
    if (newTarget) {
      variableSource.target = newTarget.id;
      update();
      setApplyReady();
    }
  };

  const labelID = `variable-source-${id}`;

  return (
    <TableRow
      hover
      role="checkbox"
      aria-checked={selected}
      tabIndex={-1}
      selected={selected}
    >
      <TableCell padding="checkbox">
        <Checkbox
          onClick={() => {
            onClick(id);
          }}
          color="primary"
          checked={selected}
          inputProps={{
            'aria-labelledby': labelID
          }}
        />
      </TableCell>
      <TableCell component="th" id={labelID} scope="row" padding="none">
        <TextField
          hiddenLabel
          name="alias"
          variant="standard"
          onBlur={(e) => {
            formik.handleBlur(e);
            formik.handleSubmit();
          }}
          onKeyDown={onEnter}
          onChange={formik.handleChange}
          value={formik.values.alias}
          error={formik.touched.alias && formik.errors.alias !== undefined}
          helperText={formik.touched.alias && formik.errors.alias}
        />
      </TableCell>
      <TableCell align="right">
        <NativeSelect
          native
          variant="standard"
          value={category}
          onChange={handleCategoryChanged}
        >
          <option aria-label="None" value="" />
          <option value="element">Elements</option>
          <option value="measureTool">Measure Tools</option>
          <option value="roVariable">Readonly Variables</option>
        </NativeSelect>
      </TableCell>
      <TableCell align="right">
        <NativeSelect
          native
          variant="standard"
          value={sourceSelected}
          onChange={handleSourceChanged}
        >
          <option aria-label="None" value="" />
          {sourceCandidates.map((s) => (
            <option value={s.nodeID} key={s.nodeID}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </TableCell>
      <TableCell align="right">
        <NativeSelect
          native
          disabled={category === 'readonlyVariable'}
          variant="standard"
          value={targetSelected}
          onChange={handleTargetChanged}
        >
          <option aria-label="None" value="" />
          {targetCandidates.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      </TableCell>
      <TableCell align="right">{toFixedNoZero(variableSource.value)}</TableCell>
    </TableRow>
  );
}

function MyTableHead(props: {
  numSelected: number;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowCount: number;
}) {
  const {onSelectAllClick, numSelected, rowCount} = props;

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
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const MyTableToolbar = (props: {
  variable: IReadonlyVariable;
  selected: readonly number[];
  setSelected: React.Dispatch<React.SetStateAction<readonly number[]>>;
  setApplyReady: (variable: IReadonlyVariable) => void;
}) => {
  const {variable, selected, setSelected, setApplyReady} = props;

  const onDeleteClick = () => {
    variable.sources = variable.sources.filter((_, i) => selected.includes(i));
    setSelected([]);
    setApplyReady(variable);
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
          Sources
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
