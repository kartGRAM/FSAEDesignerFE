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
}): JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {data, setData, layout, setLayout, mode, dataIndex} = props;
  return <Box component="div">aaa</Box>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*
function DataRow(props: {
  results: CaseResults;
  localInstances: LocalInstances;
  axis: 'x' | 'y' | 'z';
  data: IChartData;
  setData: (data: IChartData) => void;
  selected: boolean;
  setSelected: (value: boolean) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unreachable
  const {results, localInstances, data, setData, selected, setSelected, axis} =
    props;
  const labelId = data.nodeID + axis;
  const dataRef = data[axis];

  const handleTargetChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    if (value.includes('@Control')) {
      const nodeID = value.split('@')[0];
      const control = controls.find((c) => c.nodeID === nodeID);
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

  return (
    <TableRow
      hover
      role="checkbox"
      aria-checked={selected}
      tabIndex={-1}
      key={data.nodeID}
      selected={selected}
    >
      <TableCell padding="checkbox">
        <Checkbox
          onChange={(e) => setSelected(e.target.value)}
          color="primary"
          checked={selected}
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
*/
