import * as React from 'react';
import {Font} from 'plotly.js';
import store from '@store/store';
import {TableRow, TableCell, Checkbox} from '@mui/material';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import {MuiColorInput, MuiColorInputColors} from 'mui-color-input';
import {useFormik} from 'formik';
import yup from '@app/utils/Yup';
import TextField from '@mui/material/TextField';
import {isNumber, fontFamilies} from '@utils/helpers';

export const CheckBoxRow = React.memo(
  (props: {
    name: string;
    value: boolean;
    setValue: (value: boolean) => void;
    thirdColumn?: JSX.Element;
  }) => {
    const {name, value, setValue, thirdColumn} = props;
    return (
      <TableRow>
        <TableCell scope="row" align="left">
          {name}
        </TableCell>
        <TableCell scope="row" padding="none" align="left">
          <Checkbox checked={value} onChange={(_, c) => setValue(c)} />
        </TableCell>
        <TableCell scope="row" padding="none" align="left">
          {thirdColumn}
        </TableCell>
      </TableRow>
    );
  }
);

export const ColorPickerRow = React.memo(
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

export const NullableColorPickerRow = React.memo(
  (props: {
    name: string;
    color: string | undefined;
    onChange: (color: string | undefined) => void;
  }) => {
    const {uitgd} = store.getState();
    const menuZIndex =
      uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;
    const {name, color, onChange} = props;
    const handleChange = React.useCallback(
      (newValue: string, colors: MuiColorInputColors) => {
        onChange(newValue !== '' ? colors.hex : undefined);
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
            value={color ?? ''}
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
            value={color ?? ''}
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

export function SelectorRow<T>(props: {
  name: string;
  selection: readonly T[];
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

export const NumberRow = React.memo(
  (props: {
    name: string;
    value: number;
    setValue: (value: number) => void;
    min?: number;
    max?: number;
  }) => {
    const {name, value, setValue, min, max} = props;

    let schema = yup.number().required('');
    if (min !== undefined) schema = schema.min(min);
    if (max !== undefined) schema = schema.max(max);

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        value
      },
      validationSchema: yup.object({
        value: schema
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
            sx={{width: '100%'}}
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

export const NullableNumberRow = React.memo(
  (props: {
    name: string;
    value: number | undefined;
    setValue: (value: number | undefined) => void;
    min?: number;
    max?: number;
  }) => {
    const {name, value, setValue, min, max} = props;

    let schema = yup.number();
    if (min !== undefined) schema = schema.min(min);
    if (max !== undefined) schema = schema.max(max);

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        value
      },
      validationSchema: yup.object({
        value: schema
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
            sx={{width: '100%'}}
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

export const FontRows = React.memo(
  (props: {
    name: string;
    font?: Partial<Font>;
    setValue: (value: Font) => void;
  }) => {
    const {name, font, setValue} = props;

    const newFont: Font = {
      family: font?.family ?? 'Arial, sans-serif',
      size: font?.size ?? 13,
      color: font?.color ?? '#000000'
    };

    return (
      <>
        <SelectorRow
          name={`${name}: font family`}
          selection={fontFamilies}
          value={font?.family ?? newFont.family}
          onChange={(value) => {
            setValue({...newFont, family: value ?? 'Arial, sans-serif'});
          }}
        />
        <NumberRow
          name={`${name}: size`}
          value={font?.size ?? newFont.size}
          setValue={(value) => {
            setValue({...newFont, size: value});
          }}
          min={0}
        />
        <ColorPickerRow
          name={`${name}: color`}
          color={(font?.color ?? newFont.color) as string}
          onChange={(c) => {
            setValue({...newFont, color: c});
          }}
        />
      </>
    );
  }
);

export const StringRow = React.memo(
  (props: {
    name: string;
    value: string | undefined;
    setValue: (value: string | undefined) => void;
  }) => {
    const {name, value, setValue} = props;

    const schema = yup.string();

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        value
      },
      validationSchema: yup.object({
        value: schema
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
            sx={{width: '100%'}}
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
