import React, {useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {Vector3, Matrix3} from 'three';
import {getMatrix3, getDataVector3} from '@gd/NamedValues';
import {INamedVector3, IPointOffsetTool} from '@gd/IDataValues';
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

import {NumberToRGB} from '@app/utils/helpers';

export interface Props {
  vector: INamedVector3;
  offset?: Vector3;
  rotation?: Matrix3;
}

interface ValueProps extends OutlinedTextFieldProps {
  name?: string;
  id?: string;
}

const ValueField = (props: ValueProps) => {
  const {name, id} = props;
  return (
    <TextField
      size="small"
      name={name}
      id={id}
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
};

export default function Vector(props: Props) {
  const {vector, offset, rotation} = props;
  const rot = rotation ?? new Matrix3();
  const ofs = offset ?? new Vector3();
  const dispatch = useDispatch();
  const coMatrix = useSelector(
    (state: RootState) => state.dgd.present.transCoordinateMatrix
  );
  const sVector = vector.getStringValue();

  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<string>('');
  const [focused, setFocused] = useState<boolean>(false);
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
      dispatch(updateAssembly({element: vector.parent}));
    }
  });

  React.useEffect(() => {
    if (focused)
      dispatch(setSelectedPoint({point: getDataVector3(trans(vector))}));
    return () => {
      if (!focused) dispatch(setSelectedPoint({point: null}));
    };
  }, [focused, vector]);

  const trans = (p: INamedVector3) => {
    return ofs
      .clone()
      .add(p.value.clone().applyMatrix3(rot))
      .applyMatrix3(getMatrix3(coMatrix));
  };

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
  return (
    <Box sx={{padding: 1}} onFocus={handleFocus} onBlur={handleBlur}>
      <Typography>{vector.name}</Typography>
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
          />
          <ValueField
            onChange={handleChange}
            label="Y"
            name="y"
            variant="outlined"
            value={formik.values.y}
            error={formik.touched.y && Boolean(formik.errors.y)}
            helperText={formik.touched.y && formik.errors.y}
          />
          <ValueField
            onChange={handleChange}
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
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <AddBoxIcon />
                  </IconButton>
                </Tooltip>
                {selected !== '' ? (
                  <Tooltip title="Delete" sx={{flex: '1'}}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
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
            pointOffsetTools={vector.pointOffsetTools}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export function PointOffsetList(props: {
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  pointOffsetTools?: IPointOffsetTool[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {pointOffsetTools, selected, setSelected} = props;
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );
  return (
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
              >
                <TableCell>{idx + 1}</TableCell>
                <TableCell sx={{whiteSpace: 'nowrap'}}>{tool.name}</TableCell>
                <TableCell align="right">{tool.className}</TableCell>
                <TableCell align="right">{dx}</TableCell>
                <TableCell align="right">{dy}</TableCell>
                <TableCell align="right">{dz}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
