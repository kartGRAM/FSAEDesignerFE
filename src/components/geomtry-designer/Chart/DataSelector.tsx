import * as React from 'react';
import {IChartData, dataFrom, axesSet} from '@gd/charts/ICharts';
import {CaseResults} from '@worker/solverWorkerMessage';
import {LocalInstances} from '@worker/getLocalInstances';
import {
  Typography,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Table,
  Box,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import {
  getSelectableData,
  SelectableDataCategory,
  getCases
} from '@gd/charts/getPlotlyData';
import EditableTypography from '@gdComponents/EditableTypography';
import {v4 as uuidv4} from 'uuid';
import * as Yup from 'yup';
import CloseIcon from '@mui/icons-material/Close';
import {PlotType} from 'plotly.js';
import {is3DPlotType} from '@gd/charts/plotlyUtils';

export function DataSelector(props: {
  results: CaseResults;
  localInstances: LocalInstances;
  data: IChartData[];
  setData: (data: IChartData[]) => void;
  defaultPlotType: PlotType;
}) {
  const {data, setData, defaultPlotType} = props;

  const setDatum = React.useCallback(
    (datum: IChartData) => {
      let inData = false;
      const newData = data.map((d) => {
        if (d.nodeID === datum.nodeID) {
          inData = true;
          return datum;
        }
        return d;
      });
      if (!inData) newData.push(datum);
      setData(newData);
    },
    [data, setData]
  );

  const deleteDatum = React.useCallback(
    (datum: IChartData) => {
      setData(data.filter((d) => d.nodeID !== datum.nodeID));
    },
    [data, setData]
  );

  const newData: IChartData = {
    nodeID: uuidv4(),
    type: defaultPlotType,
    x: {case: '', from: 'measureTool', nodeID: ''},
    y: {case: '', from: 'measureTool', nodeID: ''},
    z: {case: '', from: 'measureTool', nodeID: ''},
    xaxis: 'x1',
    yaxis: 'y1'
  };
  return (
    <Box
      component="div"
      sx={{
        height: '100%'
      }}
    >
      {data.map((datum, i) => (
        <>
          {i > 0 ? <Divider key={`${datum.nodeID}d`} /> : null}
          <DataTable
            {...props}
            key={datum.nodeID}
            data={datum}
            setData={setDatum}
            deleteData={deleteDatum}
          />
        </>
      ))}
      <Divider key="newd" />
      <DataTable {...props} key="new" data={newData} setData={setDatum} isNew />
    </Box>
  );
}

const DataTable = React.memo(
  (props: {
    results: CaseResults;
    localInstances: LocalInstances;
    data: IChartData;
    setData: (data: IChartData) => void;
    deleteData?: (data: IChartData) => void;
    isNew?: boolean;
  }) => {
    const {data, setData, deleteData, isNew} = props;
    return (
      <Box component="div" sx={{mt: 2, mb: 2}}>
        <Box
          component="div"
          sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
        >
          <EditableTypography
            disabled={isNew}
            typography={<Typography>{data.name ?? 'label'}</Typography>}
            initialValue={data.name ?? 'label'}
            validation={Yup.string().required('required')}
            onSubmit={(value) => {
              if (data.name !== value) {
                setData({...data, name: value});
              }
            }}
            boxProps={{
              sx: {
                minWidth: '0%',
                flexGrow: 1
              }
            }}
            textFieldProps={{
              sx: {
                pt: 0,
                pl: 0,
                pr: 1,
                minWidth: '0%',
                flexGrow: 1,
                '& legend': {display: 'none'},
                '& fieldset': {top: 0}
              },
              InputProps: {
                sx: {color: '#000', '& input': {p: 0.5}}
              }
            }}
          />
          {!isNew ? (
            <Tooltip title="Delete">
              <IconButton
                onClick={deleteData ? () => deleteData(data) : undefined}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
        <TableContainer>
          <Table size="small">
            <TableBody>
              <DataRow {...props} axis="x" key="x" />
              <DataRow {...props} axis="y" key="y" />
              {is3DPlotType(data.type) ? (
                <DataRow {...props} axis="z" key="z" />
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }
);

const DataRow = React.memo(
  (props: {
    results: CaseResults;
    localInstances: LocalInstances;
    axis: 'x' | 'y' | 'z';
    data: IChartData;
    setData: (data: IChartData) => void;
  }) => {
    const {results, localInstances, data, setData, axis} = props;
    const dataRef = data[axis];
    const {from} = dataRef;
    const axes = axesSet[axis];

    const selectableData = getSelectableData(
      results,
      localInstances
    ).children?.find((v) => v.name === dataRef.from)!;

    const handleFromChanged = React.useCallback(
      (e: SelectChangeEvent<string>) => {
        const {value} = e.target;
        const newRef = {...dataRef};
        newRef.from = value as any;
        const newData = {...data};
        newData[axis] = newRef;
        setData(newData);
      },
      [axis, data, dataRef, setData]
    );

    const handleNodeIDChanged = React.useCallback(
      (e: SelectChangeEvent<string>) => {
        const {value} = e.target;
        const newRef = {...dataRef};
        newRef.nodeID = value;
        const newData = {...data};
        newData[axis] = newRef;
        setData(newData);
      },
      [axis, data, dataRef, setData]
    );

    const handleCaseChanged = React.useCallback(
      (e: SelectChangeEvent<string>) => {
        const {value} = e.target;
        const newRef = {...dataRef};
        newRef.case = value;
        const newData = {...data};
        newData[axis] = newRef;
        setData(newData);
      },
      [axis, data, dataRef, setData]
    );

    const handleAxisChanged = React.useCallback(
      (e: SelectChangeEvent<string>) => {
        if (axis === 'z') return;
        const {value} = e.target;
        const newData = {...data};
        if (axis === 'x') newData.xaxis = value as any;
        else if (axis === 'y') newData.yaxis = value as any;
        setData(newData);
      },
      [axis, data, setData]
    );

    const cases = getCases(results);

    return (
      <TableRow
        hover
        role="checkbox"
        // aria-checked={selected}
        key={axis}
        tabIndex={-1}
      >
        <TableCell scope="row" padding="none" align="left" key="from">
          <NativeSelect
            sx={{width: '100%'}}
            native
            variant="standard"
            value={from}
            onChange={handleFromChanged}
          >
            {dataFrom.map((f) => (
              <option value={f} key={f}>
                {f}
              </option>
            ))}
          </NativeSelect>
        </TableCell>
        <TableCell scope="row" padding="none" align="left" key="node">
          <NativeSelect
            sx={{width: '100%'}}
            native
            variant="standard"
            value={dataRef.nodeID}
            onChange={handleNodeIDChanged}
          >
            <option aria-label="None" value="" key="none" />
            <GetOptions data={selectableData} key={dataRef.from} />
          </NativeSelect>
        </TableCell>
        <TableCell scope="row" padding="none" align="left" key="case">
          <NativeSelect
            sx={{width: '100%'}}
            native
            variant="standard"
            value={dataRef.case}
            onChange={handleCaseChanged}
          >
            <option aria-label="None" value="" key="none" />
            {cases.map((c) => (
              <option value={c.nodeID} key={c.nodeID}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </TableCell>
        <TableCell scope="row" padding="none" align="left" key="axis">
          {axis !== 'z' ? (
            <NativeSelect
              sx={{width: '100%'}}
              native
              variant="standard"
              value={axis === 'x' ? data.xaxis : data.yaxis}
              onChange={handleAxisChanged}
            >
              {axes.map((a) => (
                <option value={a} key={a}>
                  {a}
                </option>
              ))}
            </NativeSelect>
          ) : null}
        </TableCell>
      </TableRow>
    );
  }
);

const GetOptions = (props: {
  data: SelectableDataCategory;
}): JSX.Element | null => {
  const {data} = props;
  if (!data.children) {
    return <option value={data.nodeID}>{data.name}</option>;
  }
  return (
    <>
      <optgroup label={data.name} key={data.nodeID} />
      {data.children.map((child) => (
        <GetOptions data={child} key={child.nodeID} />
      ))}
    </>
  );
};
