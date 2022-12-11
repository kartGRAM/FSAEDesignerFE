/* eslint-disable no-nested-ternary */
import React, {useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {DeltaXYZ} from '@gd/NamedValues';
import {INamedVector3, IPointOffsetTool} from '@gd/INamedValues';
import Typography from '@mui/material/Typography';
import {useDispatch, useSelector} from 'react-redux';
import {
  setSelectedPoint,
  setCopyFromExistingPointsDialogProps,
  setMovePointDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import {isElement} from '@gd/IElements';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {RootState} from '@store/store';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Toolbar from '@mui/material/Toolbar';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {alpha} from '@mui/material/styles';
import {PointOffsetToolDialog} from '@gdComponents/dialog-components/PointOffsetToolDialog';
import Target from '@gdComponents/svgs/Target';
import Move from '@gdComponents/svgs/Move';
import Direction from '@gdComponents/svgs/Direction';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import {numberToRgb, toFixedNoZero} from '@app/utils/helpers';

export interface Props {
  vector: INamedVector3;
  removable?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  disableSceneButton?: boolean;
  directionMode?: boolean;
  isNode?: boolean;
}

const Vector = React.memo((props: Props) => {
  const {
    vector,
    removable,
    onRemove,
    disabled,
    disableSceneButton,
    directionMode,
    isNode
  } = props;
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const point = (
    useSelector((state: RootState) => state.uitgd.gdSceneState.selectedPoint) ??
    []
  ).at(0);
  const sVector = vector.getStringValue();

  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [rename, setRename] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<string>('');
  const [focused, setFocused] = useState<boolean>(false);

  const nameFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: vector.name
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName()
        .required('required')
    }),
    onSubmit: (values) => {
      vector.name = values.name;
      dispatch(updateAssembly(vector));
      setRename(false);
    }
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      x: sVector.x,
      y: sVector.y,
      z: sVector.z
    },
    validationSchema: Yup.object({
      x: Yup.string().gdFormulaIsValid().required('required'),
      y: Yup.string().gdFormulaIsValid().required('required'),
      z: Yup.string().gdFormulaIsValid().required('required')
    }),
    onSubmit: (values) => {
      vector.setValue(values);
      dispatch(updateAssembly(vector));
    }
  });

  React.useEffect(() => {
    if (focused) dispatch(setSelectedPoint({point: vector}));
  }, [focused, vector]);

  const ref = React.useRef<HTMLInputElement>(null);
  const refOfVectorField = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (rename) {
      ref.current?.focus();
    }
  }, [rename]);

  React.useEffect(() => {
    if (point && point.point.nodeID === vector.nodeID && !focused) {
      refOfVectorField.current?.focus();
    }
  }, [point]);

  const handleFocus = React.useCallback(() => {
    setFocused(true);
  }, []);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      formik.handleChange(event);
      setTimeout(formik.handleSubmit, 0);
    },
    [formik]
  );

  const handleBlur = React.useCallback(() => {
    setFocused(false);
  }, []);

  const handlePointOffsetToolAdd = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      const tools = vector.pointOffsetTools ?? [];
      tools.push(
        new DeltaXYZ({
          value: {
            name: `pointOffsetTool${tools.length}`,
            dx: 0,
            dy: 0,
            dz: 0
          },
          parent: vector
        })
      );
      vector.pointOffsetTools = tools;
      dispatch(updateAssembly(vector));
    },
    [vector]
  );

  const handlePointOffsetToolDelete = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      const tools = vector.pointOffsetTools ?? [];
      vector.pointOffsetTools = tools.filter((tool) => tool.name !== selected);
      dispatch(updateAssembly(vector));
      setSelected('');
    },
    [vector, selected]
  );

  const handleNameDblClick = React.useCallback(() => {
    nameFormik.resetForm();
    setRename(true);
  }, [nameFormik]);

  const onNameEnter = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        nameFormik.handleSubmit();
      }
    },
    [nameFormik]
  );

  const onNameBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
      setRename(false);
      nameFormik.handleBlur(e);
    },
    [nameFormik]
  );

  const handleAccordionOpen = React.useCallback(() => {
    if (expanded) setSelected('');
    setExpanded((prev) => !prev);
  }, [expanded]);

  return (
    <Box
      component="div"
      sx={{padding: 1}}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Toolbar
        sx={{
          pl: '0.3rem!important',
          pr: '0.3rem!important',
          pb: '0rem!important',
          minHeight: '40px!important',
          flex: '1'
        }}
      >
        {!rename ? (
          <Typography
            sx={{flex: '1 1 100%'}}
            color="inherit"
            variant="subtitle1"
            component="div"
            onDoubleClick={handleNameDblClick}
          >
            {vector.name}
          </Typography>
        ) : (
          <TextField
            inputRef={ref}
            onChange={nameFormik.handleChange}
            // label="name"
            name="name"
            variant="outlined"
            size="small"
            onKeyDown={onNameEnter}
            value={nameFormik.values.name}
            onBlur={onNameBlur}
            error={nameFormik.touched.name && Boolean(nameFormik.errors.name)}
            helperText={nameFormik.touched.name && nameFormik.errors.name}
            sx={{
              '& legend': {display: 'none'},
              '& fieldset': {top: 0}
            }}
          />
        )}
        {isNode && !disabled ? (
          <FormControlLabel
            sx={{margin: 0, whiteSpace: 'nowrap'}}
            control={
              <Checkbox
                checked={!!vector.meta.isFreeNode}
                size="small"
                onChange={(e) => {
                  const {checked} = e.target;
                  vector.meta.isFreeNode = checked;
                  dispatch(updateAssembly(vector));
                }}
              />
            }
            label="free node"
          />
        ) : null}
        {removable && !disabled ? (
          <Tooltip title="Delete" sx={{flex: '1'}}>
            <IconButton
              onClick={() => {
                if (onRemove) onRemove();
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </Toolbar>
      <form onSubmit={formik.handleSubmit}>
        <Box
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            inputRef={refOfVectorField}
            disabled={disabled}
            onChange={handleChange}
            label="X"
            name="x"
            variant="outlined"
            value={formik.values.x}
            error={formik.touched.x && Boolean(formik.errors.x)}
            helperText={formik.touched.x && formik.errors.x}
            onBlur={formik.handleBlur}
          />
          <ValueField
            disabled={disabled}
            onChange={handleChange}
            onBlur={formik.handleBlur}
            label="Y"
            name="y"
            variant="outlined"
            value={formik.values.y}
            error={formik.touched.y && Boolean(formik.errors.y)}
            helperText={formik.touched.y && formik.errors.y}
          />
          <ValueField
            disabled={disabled}
            onChange={handleChange}
            onBlur={formik.handleBlur}
            label="Z"
            name="z"
            variant="outlined"
            value={formik.values.z}
            error={formik.touched.z && Boolean(formik.errors.z)}
            helperText={formik.touched.z && formik.errors.z}
          />
          {!disableSceneButton ? (
            !directionMode ? (
              <>
                <Target
                  disabled={disabled}
                  title="Copy from existing points"
                  onClick={() => {
                    dispatch(
                      setCopyFromExistingPointsDialogProps({
                        open: true,
                        onSelected: (p) => {
                          if (isElement(vector.parent)) {
                            p.sub(vector.parent.position.value);
                          }
                          formik.setFieldValue('x', p.x);
                          formik.setFieldValue('y', p.y);
                          formik.setFieldValue('z', p.z);
                          setTimeout(formik.handleSubmit, 0);
                        }
                      })
                    );
                  }}
                />
                <Move
                  disabled={disabled}
                  title="Move this point dynamically"
                  onClick={() => {
                    dispatch(
                      setMovePointDialogProps({
                        open: true,
                        target: vector,
                        onMoved: (delta) => {
                          const v = vector.value;
                          v.add(delta);
                          formik.setFieldValue('x', toFixedNoZero(v.x, 3));
                          formik.setFieldValue('y', toFixedNoZero(v.y, 3));
                          formik.setFieldValue('z', toFixedNoZero(v.z, 3));
                          setTimeout(formik.handleSubmit, 0);
                        }
                      })
                    );
                  }}
                />
              </>
            ) : (
              <Direction title="Copy from existing normal vector." />
            )
          ) : null}
        </Box>
      </form>
      <Accordion
        TransitionProps={{unmountOnExit: true}}
        expanded={expanded}
        onChange={handleAccordionOpen}
        sx={{
          backgroundColor: '#eee',
          ml: 1,
          mr: 1,
          '&.Mui-expanded': {
            ml: 1,
            mr: 1,
            mt: 0,
            mb: 0
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={{
            '.MuiAccordionSummary-content': {
              mt: 0,
              mb: 0
            },
            minHeight: 0,
            '.Mui-expanded': {
              mt: 1,
              mb: 1
            }
          }}
        >
          <Toolbar
            sx={{
              pl: '0!important',
              pr: '1rem!important',
              minHeight: '40px!important',
              flex: '1'
            }}
          >
            <Typography
              sx={{flex: '1 1 100%'}}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              Point Offset Tools
            </Typography>
            {expanded ? (
              <>
                {!disabled ? (
                  <Tooltip title="Add" sx={{flex: '1'}}>
                    <IconButton onClick={handlePointOffsetToolAdd}>
                      <AddBoxIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {selected !== '' && !disabled ? (
                  <Tooltip title="Delete" sx={{flex: '1'}}>
                    <IconButton onClick={handlePointOffsetToolDelete}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </>
            ) : null}
          </Toolbar>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}}>
          <PointOffsetList
            selected={selected}
            setSelected={setSelected}
            vector={vector}
            disabled={disabled}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
});
export default Vector;

const PointOffsetList = React.memo(
  (props: {
    selected: string;
    setSelected: (value: string) => void;
    vector: INamedVector3;
    disabled?: boolean;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {vector, selected, setSelected, disabled} = props;
    const {pointOffsetTools} = vector;
    const enabledColorLight: number = useSelector(
      (state: RootState) => state.uigd.present.enabledColorLight
    );
    const [open, setOpen] = useState(false);
    const [toolAndIdx, setToolAndIdx] = useState<{
      tool: IPointOffsetTool;
      idx: number;
    } | null>(null);
    const onToolDblClick = (tool: IPointOffsetTool, idx: number) => {
      if (disabled) return;
      setOpen(true);
      setToolAndIdx({tool, idx});
    };
    return (
      <>
        <TableContainer
          component={Paper}
          sx={{
            '&::-webkit-scrollbar': {
              height: '10px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: numberToRgb(enabledColorLight),
              borderRadius: '5px'
            }
          }}
        >
          <Table
            sx={{backgroundColor: alpha('#FFF', 0.0)}}
            size="small"
            aria-label="a dense table"
          >
            <TableHead>
              <TableRow onClick={() => setSelected('')}>
                <TableCell>Order</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Type</TableCell>
                <TableCell align="right">ΔX</TableCell>
                <TableCell align="right">ΔY</TableCell>
                <TableCell align="right">ΔZ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pointOffsetTools?.map((tool, idx) => {
                const {dx, dy, dz} = tool.getOffsetVector();
                return (
                  <TableRow
                    key={tool.name}
                    sx={{
                      '&:last-child td, &:last-child th': {border: 0},
                      userSelect: 'none',
                      backgroundColor:
                        selected === tool.name
                          ? alpha(numberToRgb(enabledColorLight), 0.5)
                          : 'unset'
                    }}
                    onClick={() => setSelected(tool.name)}
                    onDoubleClick={() => onToolDblClick(tool, idx)}
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {tool.name}
                    </TableCell>
                    <TableCell align="right">{tool.className}</TableCell>
                    <TableCell align="right">{toFixedNoZero(dx, 3)}</TableCell>
                    <TableCell align="right">{toFixedNoZero(dy, 3)}</TableCell>
                    <TableCell align="right">{toFixedNoZero(dz, 3)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {toolAndIdx ? (
          <PointOffsetToolDialog
            open={open}
            setOpen={setOpen}
            tool={toolAndIdx.tool}
            indexOfTool={toolAndIdx.idx}
            vector={vector}
          />
        ) : null}
      </>
    );
  }
);

const ValueField = React.memo((props: OutlinedTextFieldProps) => {
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">mm</InputAdornment>
      }}
      sx={{
        margin: 1
        // width: '15ch'
      }}
    />
  );
});
