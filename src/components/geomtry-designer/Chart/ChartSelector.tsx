/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import {IChartData, IChartLayout} from '@gd/charts/ICharts';
import {CaseResults} from '@worker/solverWorkerMessage';
import {LocalInstances} from '@worker/getLocalInstances';
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
  Table,
  Paper,
  Box
} from '@mui/material';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import {
  getSelectableData,
  SelectableDataCategory,
  getCases
} from '@gd/charts/getPlotlyData';
import {isArray} from '@utils/helpers';
import {v4 as uuidv4} from 'uuid';

export type Mode =
  | 'DataSelect'
  | 'XAxis'
  | 'YAxis'
  | 'ZAxis'
  | 'DataVisualization';

export function ChartSelector(props: {
  data: IChartData[];
  setData: (data: IChartData[]) => void;
  layout: IChartLayout;
  setLayout: (layout: IChartLayout) => void;
  mode: Mode;
  dataIndex: number | undefined;
  results: CaseResults;
  localInstances: LocalInstances;
}): JSX.Element | null {
  const {mode} = props;
  if (mode === 'DataSelect') {
    return <DataSelector {...props} />;
  }
  return null;
}

export function DataSelector(props: {
  results: CaseResults;
  localInstances: LocalInstances;
  data: IChartData[];
  setData: (data: IChartData[]) => void;
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
    x: {case: '', from: 'element', nodeID: ''},
    y: {case: '', from: 'element', nodeID: ''},
    xaxis: 'x1',
    yaxis: 'y1'
  };
  return (
    <>
      {data.map((datum) => (
        <DataTable
          key={datum.nodeID}
          {...props}
          data={datum}
          setData={setDatum}
        />
      ))}
      <DataTable key="new" {...props} data={newData} setData={setDatum} />
    </>
  );
}

export function DataTable(props: {
  results: CaseResults;
  localInstances: LocalInstances;
  data: IChartData;
  setData: (data: IChartData) => void;
}) {
  return (
    <Box component="div">
      <TableContainer>
        <Table size="small">
          <TableBody>
            <DataRow {...props} axis="x" />
            <DataRow {...props} axis="y" />
            <DataRow {...props} axis="z" />
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
  const labelId = data.nodeID + axis;
  const dataRef = data[axis];

  const selectableData = getSelectableData(results, localInstances);

  const handleNodeIDChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
  };

  const handleCaseChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
  };

  const cases = getCases(results);

  const getOptions = (data: SelectableDataCategory): JSX.Element => {
    const keys = Object.keys(data);
    return (
      <>
        {keys.map((key) => {
          const values = data[key];
          if (
            isArray<{
              nodeID: string;
              name: string;
              categoryName: string;
            }>(values)
          ) {
            if (values.length === 0) return null;
            const {categoryName} = values[0];
            return (
              <>
                <optgroup label={categoryName} />
                {values.map((value) => (
                  <option value={value.nodeID} key={value.nodeID}>
                    {value.name}
                  </option>
                ))}
              </>
            );
          }
          return getOptions(values);
        })}
      </>
    );
  };

  return (
    <TableRow
      hover
      role="checkbox"
      // aria-checked={selected}
      tabIndex={-1}
      key={data.nodeID}
      // selected={selected}
    >
      <TableCell padding="checkbox">
        <Checkbox
          // onChange={(e) => setSelected(e.target.checked)}
          color="primary"
          // checked={selected}
          inputProps={{
            'aria-labelledby': labelId
          }}
        />
      </TableCell>
      <TableCell id={labelId} scope="row" padding="none" align="left">
        <NativeSelect
          native
          variant="standard"
          value={dataRef?.nodeID ?? ''}
          onChange={handleNodeIDChanged}
        >
          <option aria-label="None" value="" />
          {getOptions(selectableData)}
        </NativeSelect>
      </TableCell>
      <TableCell id={labelId} scope="row" padding="none" align="left">
        <NativeSelect
          native
          variant="standard"
          value={dataRef?.case ?? ''}
          onChange={handleCaseChanged}
        >
          <option aria-label="None" value="" />
          {cases.map((c) => (
            <option value={c.nodeID} key={c.nodeID}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </TableCell>

      <TableCell align="right" />
      <TableCell align="right" />
    </TableRow>
  );
}
