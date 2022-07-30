import React, {useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {Vector3, Matrix3} from 'three';
import {getMatrix3, getDataVector3} from '@gd/NamedValues';
import {INamedVector3} from '@gd/IDataValues';
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
        defaultExpanded={false}
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
            <Tooltip title="Swap" sx={{flex: '1'}}>
              <IconButton>
                <AddBoxIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete" sx={{flex: '1'}}>
              <IconButton>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}}>
          <DenseTable />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number
) {
  return {name, calories, fat, carbs, protein};
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9)
];

export function DenseTable() {
  return (
    <TableContainer component={Paper}>
      <Table sx={{minWidth: 650}} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Dessert (100g serving)</TableCell>
            <TableCell align="right">Calories</TableCell>
            <TableCell align="right">Fat&nbsp;(g)</TableCell>
            <TableCell align="right">Carbs&nbsp;(g)</TableCell>
            <TableCell align="right">Protein&nbsp;(g)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.name}
              sx={{'&:last-child td, &:last-child th': {border: 0}}}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.calories}</TableCell>
              <TableCell align="right">{row.fat}</TableCell>
              <TableCell align="right">{row.carbs}</TableCell>
              <TableCell align="right">{row.protein}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
