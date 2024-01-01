import * as React from 'react';
import {Font, DataTitle, Pattern} from 'plotly.js';
import store from '@store/store';
import {TableRow, TableCell, Checkbox, Typography} from '@mui/material';
import NativeSelect, {SelectChangeEvent} from '@mui/material/Select';
import {MuiColorInput, MuiColorInputColors} from 'mui-color-input';
import {useFormik} from 'formik';
import yup from '@app/utils/Yup';
import TextField from '@mui/material/TextField';
import {isNumber, fontFamilies, deepCopy, toFixedNoZero} from '@utils/helpers';
import {positions} from '@gd/charts/plotlyUtils';

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

export function NoNullSelectorRow<T>(props: {
  name: string;
  selection: readonly NonNullable<T>[];
  value: NonNullable<T>;
  onChange: (value: NonNullable<T>) => void;
}) {
  const {name, value, selection, onChange} = props;

  const handleChanged = (e: SelectChangeEvent<string>) => {
    const {value} = e.target;
    if (value === 'true') onChange(true as NonNullable<T>);
    if (value === 'false') onChange(false as NonNullable<T>);
    if (isNumber(value)) onChange(Number(value) as NonNullable<T>);
    onChange(value as NonNullable<T>);
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
    integer?: boolean;
  }) => {
    const {name, value, setValue, min, max, integer} = props;

    let schema = yup.number().required('');
    if (integer) schema = schema.integer();
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
    integer?: boolean;
  }) => {
    const {name, value, setValue, min, max, integer} = props;

    let schema = yup.number();
    if (integer) schema = schema.integer();
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

export const NullableNumberArrayRow = React.memo(
  (props: {
    name: string;
    value: number[] | undefined;
    setValue: (value: number[] | undefined) => void;
    min?: number;
    max?: number;
    sizeMin?: number;
    sizeMax?: number;
    integer?: boolean;
  }) => {
    const {name, value, setValue, min, max, integer, sizeMin, sizeMax} = props;

    let schema = yup.string().numberArray(!!integer, sizeMin, sizeMax);
    if (min !== undefined) schema = schema.arrayMin(min);
    if (max !== undefined) schema = schema.arrayMax(max);

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        values: value ? value.map((v) => toFixedNoZero(v, 3)).join(', ') : ''
      },
      validationSchema: yup.object({
        values: schema
      }),
      onSubmit: (values) => {
        if (values.values === '') {
          setValue(undefined);
        }
        const numbers = values.values
          .replace(' ', '')
          .split(',')
          .map((v) => Number(v));
        setValue(numbers);
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
            name="values"
            variant="standard"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            onKeyDown={onEnter}
            value={formik.values.values}
            error={formik.touched.values && formik.errors.values !== undefined}
            helperText={formik.touched.values && formik.errors.values}
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
    setValue: (value: Partial<Font>) => void;
  }) => {
    const {name, font, setValue} = props;

    const newFont: Partial<Font> = {
      family: font?.family ?? 'Arial, sans-serif',
      size: font?.size ?? 13,
      color: font?.color
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
          value={font?.size ?? newFont.size!}
          setValue={(value) => {
            setValue({...newFont, size: value});
          }}
          min={0}
        />
        <NullableColorPickerRow
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

export const PatternRows = React.memo(
  (props: {
    name: string;
    pattern?: Partial<Pattern>;
    setValue: (value: Partial<Pattern>) => void;
  }) => {
    const {name, pattern, setValue} = props;

    const newPattern: Partial<Pattern> = {
      ...pattern,
      shape: pattern?.shape ?? '',
      fillmode: pattern?.fillmode ?? 'replace',
      solidity: pattern?.solidity ?? 0.3,
      size: pattern?.size ?? 8
    };

    return (
      <>
        <SelectorRow
          name={`${name}: shape`}
          selection={['', '/', '\\', 'x', '-', '|', '+', '.'] as const}
          value={newPattern.shape}
          onChange={(value) => {
            setValue({...newPattern, shape: value});
          }}
        />
        <SelectorRow
          name={`${name}: fillmode`}
          selection={['replace', 'overlay'] as const}
          value={newPattern.fillmode}
          onChange={(value) => {
            setValue({...newPattern, fillmode: value});
          }}
        />
        <NullableColorPickerRow
          name={`${name}: bgcolor`}
          color={newPattern.bgcolor as string}
          onChange={(c) => {
            setValue({...newPattern, bgcolor: c});
          }}
        />
        <NullableColorPickerRow
          name={`${name}: fgcolor`}
          color={newPattern.fgcolor as string}
          onChange={(c) => {
            setValue({...newPattern, fgcolor: c});
          }}
        />
        <NullableNumberRow
          name={`${name}: opacity`}
          value={newPattern.fgopacity as any}
          setValue={(value) => {
            setValue({...newPattern, fgopacity: value as any});
          }}
          min={0}
          max={1}
        />
        <NullableNumberRow
          name={`${name}: size`}
          value={newPattern.size}
          setValue={(value) => {
            setValue({...newPattern, size: value});
          }}
          min={0}
        />
        <NullableNumberRow
          name={`${name}: solidity`}
          value={newPattern.solidity}
          setValue={(value) => {
            setValue({...newPattern, solidity: value});
          }}
          min={0}
          max={1}
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

export const DataTitleRows = React.memo(
  (props: {
    name: string;
    dataTitle?: Partial<DataTitle>;
    setValue: (value: Partial<DataTitle>) => void;
  }) => {
    const {name, dataTitle, setValue} = props;

    const newDataTitle: Partial<DataTitle> = deepCopy(dataTitle ?? {});

    return (
      <>
        <StringRow
          name={`${name}: text`}
          value={dataTitle?.text}
          setValue={(value) => {
            setValue({...newDataTitle, text: value});
          }}
        />
        <FontRows
          name={`${name}`}
          font={dataTitle?.font}
          setValue={(font) => {
            setValue({...newDataTitle, font});
          }}
        />
        <NullableNumberRow
          name={`${name}: standoff`}
          value={dataTitle?.standoff}
          setValue={(value) => {
            setValue({...newDataTitle, standoff: value});
          }}
          min={0}
        />
        <SelectorRow
          name={`${name}: position`}
          selection={positions}
          value={dataTitle?.position}
          onChange={(value) => {
            setValue({...newDataTitle, position: value});
          }}
        />
      </>
    );
  }
);

export const NullableRangeRow = React.memo(
  (props: {
    name: string;
    lower?: number;
    upper?: number;
    setValue: (params: {lower?: number; upper?: number}) => void;
    disabled?: boolean;
    min?: number;
    max?: number;
    allowReverse?: boolean;
  }) => {
    const {name, setValue, min, max, disabled, allowReverse} = props;
    let {lower, upper} = props;
    lower = lower ? Math.round(lower * 1000) / 1000 : lower;
    upper = upper ? Math.round(upper * 1000) / 1000 : upper;

    const schema = yup.object().shape(
      {
        lower: yup.number().when('uppwer', (upper, schema) => {
          if (!upper) return schema;
          let s = schema;
          if (!allowReverse) s.lessThan(upper);
          if (min !== undefined) s = s.min(min);
          if (max !== undefined) s = s.max(max);
          return s;
        }),
        upper: yup.number().when('lower', (lower, schema) => {
          if (!lower) return schema;
          let s = schema;
          if (!allowReverse) s.moreThan(upper);
          if (min !== undefined) s = s.min(min);
          if (max !== undefined) s = s.max(max);
          return s;
        })
      },
      [['lower', 'upper']]
    );

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        lower,
        upper
      },
      validationSchema: schema,
      onSubmit: (values) => {
        setValue(values);
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
            disabled={disabled}
            sx={{width: '45%', maxWidth: '45%', whiteSpace: 'normal'}}
            hiddenLabel
            name="lower"
            variant="standard"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            onKeyDown={onEnter}
            value={formik.values.lower}
            error={formik.touched.lower && formik.errors.lower !== undefined}
            helperText={formik.touched.lower && formik.errors.lower}
          />
          <Typography
            variant="caption"
            sx={{
              verticalAlign: '-webkit-baseline-middle',
              pl: 1,
              pr: 1
            }}
          >
            to
          </Typography>
          <TextField
            disabled={disabled}
            sx={{width: '45%', maxWidth: '45%', whiteSpace: 'normal'}}
            hiddenLabel
            name="upper"
            variant="standard"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            onKeyDown={onEnter}
            value={formik.values.upper}
            error={formik.touched.upper && formik.errors.upper !== undefined}
            helperText={formik.touched.upper && formik.errors.upper}
          />
        </TableCell>
        <TableCell scope="row" padding="none" align="left" />
      </TableRow>
    );
  }
);
