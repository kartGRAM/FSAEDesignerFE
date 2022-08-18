import React, {useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {getMatrix3, getDataVector3, DeltaXYZ} from '@gd/NamedValues';
import {INamedVector3, IPointOffsetTool, IDataMatrix3} from '@gd/INamedValues';
import Typography from '@mui/material/Typography';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
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
import {IElement} from '@gd/IElements';

import {NumberToRGB, toFixedNoZero} from '@app/utils/helpers';

export interface Props {
  vector: INamedVector3;
  removable?: boolean;
  onRemove?: () => void;
}

export default function Vector(props: Props) {
  const {vector, removable, onRemove} = props;
  const dispatch = useDispatch();
  const coMatrix = useSelector(
    (state: RootState) => state.dgd.present.transCoordinateMatrix
  );
  const sVector = vector.getStringValue();

  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [rename, setRename] = React.useState<boolean>(false);
  const [selected, setSelectedOrg] = React.useState<string>('');
  const [focused, setFocused] = useState<boolean>(false);
  const setSelected = React.useCallback((value: string) => {
    setSelectedOrg(value);
  }, []);

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
      vector.setStringValue(values);
      dispatch(updateAssembly(vector));
    }
  });

  React.useEffect(() => {
    if (focused)
      dispatch(
        setSelectedPoint({point: getDataVector3(trans(vector, coMatrix))})
      );
  }, [focused, vector]);

  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (rename) {
      ref.current?.focus();
    }
  }, [rename]);

  const handleFocus = () => {
    setFocused(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    setTimeout(formik.handleSubmit, 0);
  };

  const handleBlur = () => {
    setFocused(false);
  };

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
    [vector]
  );

  const handleNameDblClick = () => {
    nameFormik.resetForm();
    setRename(true);
  };

  const onNameEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      nameFormik.handleSubmit();
    }
  };

  const onNameBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>
  ) => {
    setRename(false);
    nameFormik.handleBlur(e);
  };

  return (
    <Box sx={{padding: 1}} onFocus={handleFocus} onBlur={handleBlur}>
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

        {removable ? (
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
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
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
            onChange={handleChange}
            onBlur={formik.handleBlur}
            label="Z"
            name="z"
            variant="outlined"
            value={formik.values.z}
            error={formik.touched.z && Boolean(formik.errors.z)}
            helperText={formik.touched.z && formik.errors.z}
          />
        </Box>
      </form>
      <Accordion
        expanded={expanded}
        onChange={() => {
          if (expanded) setSelected('');
          setExpanded((prev) => !prev);
        }}
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
                <Tooltip title="Add" sx={{flex: '1'}}>
                  <IconButton onClick={handlePointOffsetToolAdd}>
                    <AddBoxIcon />
                  </IconButton>
                </Tooltip>
                {selected !== '' ? (
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
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

const PointOffsetList = React.memo(
  (props: {
    selected: string;
    setSelected: (value: string) => void;
    vector: INamedVector3;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {vector, selected, setSelected} = props;
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
              backgroundColor: NumberToRGB(enabledColorLight),
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
                          ? alpha(NumberToRGB(enabledColorLight), 0.5)
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

const trans = (p: INamedVector3, coMatrix: IDataMatrix3) => {
  const element = p.parent as IElement;
  return element.position.value
    .clone()
    .add(p.value.clone().applyMatrix3(element.rotation.value))
    .applyMatrix3(getMatrix3(coMatrix));
};
