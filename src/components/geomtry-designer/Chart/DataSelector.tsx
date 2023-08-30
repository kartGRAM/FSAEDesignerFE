import * as React from 'react';
import {IChartData, dataFrom} from '@gd/charts/ICharts';
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

export function DataSelector(props: {
  results: CaseResults;
  localInstances: LocalInstances;
  data: IChartData[];
  setData: (data: IChartData[]) => void;
  is3DPlotType: boolean;
}) {
  const {data, setData} = props;

  const setDatum = (datum: IChartData) => {
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
  };
  const newData: IChartData = {
    nodeID: uuidv4(),
    type: 'scatter',
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
          {i > 0 ? <Divider /> : null}
          <DataTable
            key={datum.nodeID}
            {...props}
            data={datum}
            setData={setDatum}
          />
        </>
      ))}
      <Divider />
      <DataTable key="new" {...props} data={newData} setData={setDatum} isNew />
    </Box>
  );
}

export function DataTable(props: {
  results: CaseResults;
  localInstances: LocalInstances;
  data: IChartData;
  setData: (data: IChartData) => void;
  is3DPlotType: boolean;
  isNew?: boolean;
}) {
  const {is3DPlotType, data, setData, isNew} = props;
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
      </Box>
      <TableContainer>
        <Table size="small">
          <TableBody>
            <DataRow {...props} axis="x" key="x" />
            <DataRow {...props} axis="y" key="y" />
            {is3DPlotType ? <DataRow {...props} axis="z" key="z" /> : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function DataRow(props: {
  results: CaseResults;
  localInstances: LocalInstances;
  axis: 'x' | 'y' | 'z';
  data: IChartData;
  setData: (data: IChartData) => void;
}) {
  const {results, localInstances, data, setData, axis} = props;
  const dataRef = data[axis];
  const {from} = dataRef;

  const selectableData = getSelectableData(
    results,
    localInstances
  ).children?.find((v) => v.name === dataRef.from)!;

  const handleFromChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    const newRef = {...dataRef};
    newRef.from = value as any;
    const newData = {...data};
    newData[axis] = newRef;
    setData(newData);
  };

  const handleNodeIDChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    const newRef = {...dataRef};
    newRef.nodeID = value;
    const newData = {...data};
    newData[axis] = newRef;
    setData(newData);
  };

  const handleCaseChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    const newRef = {...dataRef};
    newRef.case = value;
    const newData = {...data};
    newData[axis] = newRef;
    setData(newData);
  };

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
    </TableRow>
  );
}

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
