import * as React from 'react';
import store from '@store/store';
import {LayoutAxis} from 'plotly.js';
import {IChartLayout, SubPlot} from '@gd/charts/ICharts';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox
} from '@mui/material';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import Settings from '@gdComponents/svgs/Settings';
import {deepCopy, isNumber} from '@utils/helpers';
import {MuiColorInput, MuiColorInputColors} from 'mui-color-input';
import {hovermodes} from '@gd/charts/plotlyUtils';
import {useFormik} from 'formik';
import yup from '@app/utils/Yup';
import TextField from '@mui/material/TextField';
import {Mode} from './ChartSelector';

export const SubPlotSettings = React.memo(
  (props: {
    setMode: (mode: Mode) => void;
    subplotTarget: SubPlot;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
    axes: string[];
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, subplotTarget, layout, setLayout, axes} = props;
    const isSubplotMode = !!layout.grid;

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                scope="row"
                align="left"
                // sx={{width: '100%'}}
              >
                item
              </TableCell>
              <TableCell scope="row" padding="none" align="left">
                value
              </TableCell>
              <TableCell scope="row" padding="none" align="left" />
            </TableRow>
          </TableHead>
          <TableBody>
            <AxesVisualization
              setMode={setMode}
              layout={layout}
              setLayout={setLayout}
              axes={axes}
              isSubplotMode={isSubplotMode}
            />
            <TableRow>
              <TableCell scope="row" align="left">
                show legends
              </TableCell>
              <TableCell scope="row" padding="none" align="left">
                <Checkbox
                  checked={layout.showlegend ?? true}
                  onChange={(_, c) => {
                    const newLayout = deepCopy(layout);
                    newLayout.showlegend = c;
                    setLayout(newLayout);
                  }}
                />
              </TableCell>
              <TableCell scope="row" padding="none" align="left" />
            </TableRow>
            <ColorPickerRow
              name="paper background color"
              color={(layout.paper_bgcolor as string | undefined) ?? '#FFFFFF'}
              onChange={(c) => {
                const newLayout = deepCopy(layout);
                newLayout.paper_bgcolor = c;
                setLayout(newLayout);
              }}
            />
            <ColorPickerRow
              name="plot background color"
              color={(layout.plot_bgcolor as string | undefined) ?? '#FFFFFF'}
              onChange={(c) => {
                const newLayout = deepCopy(layout);
                newLayout.plot_bgcolor = c;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="hover mode"
              selection={hovermodes}
              value={layout.hovermode}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.hovermode = value;
                setLayout(newLayout);
              }}
            />
            <NumberRow
              name="hover distance"
              value={layout.hoverdistance ?? 20}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.hoverdistance = value;
                setLayout(newLayout);
              }}
            />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);

const AxesVisualization = React.memo(
  (props: {
    setMode: (mode: Mode) => void;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
    axes: string[];
    isSubplotMode: boolean;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, layout, setLayout, axes, isSubplotMode} = props;
    const handleChange = React.useCallback(
      (axis: string, checked: boolean) => {
        const newLayout = deepCopy(layout);
        const layoutAxis = (newLayout as any)[axis] as Partial<LayoutAxis>;
        layoutAxis.visible = checked;
        setLayout(newLayout);
      },
      [layout, setLayout]
    );
    if (isSubplotMode) return null;
    return (
      <>
        {axes.map((axis) => {
          const layoutAxis = (layout as any)[axis] as Partial<LayoutAxis>;
          return (
            <TableRow key={axis}>
              <TableCell scope="row" align="left">
                {axis}
              </TableCell>
              <TableCell scope="row" padding="none" align="left">
                <Checkbox
                  checked={!!layoutAxis.visible}
                  onChange={(_, c) => handleChange(axis, c)}
                />
              </TableCell>
              <TableCell scope="row" padding="none" align="left">
                <Settings title="Axis settings" />
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  }
);

const ColorPickerRow = React.memo(
  (props: {name: string; color: string; onChange: (color: string) => void}) => {
    const {uitgd} = store.getState();
    const menuZIndex =
      uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;
    const {name, color, onChange} = props;
    const handleChange = React.useCallback(
      (newValue: string, colors: MuiColorInputColors) => {
        onChange(colors.hex);
      },
      [onChange]
    );
    return (
      <TableRow>
        <TableCell scope="row" align="left">
          {name}
        </TableCell>
        <TableCell scope="row" padding="none" align="left">
          <MuiColorInput
            variant="standard"
            format="hex"
            disablePopover
            value={color}
            onChange={handleChange}
            sx={{
              width: '100%',
              '& span': {
                display: 'none'
              }
            }}
          />
        </TableCell>
        <TableCell scope="row" padding="none" align="left">
          <MuiColorInput
            format="hex"
            value={color}
            onChange={handleChange}
            PopoverProps={{
              sx: {zIndex: menuZIndex}
            }}
            sx={{
              '& fieldset, input': {
                display: 'none'
              },
              '& .MuiInputAdornment-root': {
                height: 'fit-content'
              }
            }}
          />
        </TableCell>
      </TableRow>
    );
  }
);

function SelectorRow<T>(props: {
  name: string;
  selection: T[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  const {name, value, selection, onChange} = props;

  const handleChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    if (value === '') onChange(undefined);
    if (value === 'true') onChange(true as T);
    if (value === 'false') onChange(false as T);
    if (value === 'null') onChange(null as T);
    if (isNumber(value)) onChange(Number(value) as T);
    onChange(value as T);
  };

  return (
    <TableRow>
      <TableCell scope="row" align="left">
        {name}
      </TableCell>
      <TableCell scope="row" padding="none" align="left">
        <NativeSelect
          sx={{width: '100%'}}
          value={value || `${value}` === 'false' ? `${value}` : ''}
          native
          variant="standard"
          onChange={handleChanged}
        >
          <option aria-label="None" value="" key="none">
            default
          </option>
          {selection.map((s) => (
            <option value={`${s}`} key={`${s}`}>
              {`${s}`}
            </option>
          ))}
        </NativeSelect>
      </TableCell>
      <TableCell scope="row" padding="none" align="left" />
    </TableRow>
  );
}

const NumberRow = React.memo(
  (props: {name: string; value: number; setValue: (value: number) => void}) => {
    const {name, value, setValue} = props;

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        value
      },
      validationSchema: yup.object({
        value: yup.number().required('')
      }),
      onSubmit: (values) => {
        setValue(values.value);
      }
    });

    const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        formik.handleSubmit();
      }
    };
    return (
      <TableRow>
        <TableCell scope="row" align="left">
          {name}
        </TableCell>
        <TableCell scope="row" padding="none" align="left">
          <TextField
            hiddenLabel
            name="value"
            variant="standard"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            onKeyDown={onEnter}
            value={formik.values.value}
            error={formik.touched.value && formik.errors.value !== undefined}
            helperText={formik.touched.value && formik.errors.value}
          />
        </TableCell>
        <TableCell scope="row" padding="none" align="left" />
      </TableRow>
    );
  }
);
