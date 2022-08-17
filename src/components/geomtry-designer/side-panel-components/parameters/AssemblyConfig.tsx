/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {Vector3, Matrix3} from 'three';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {IAssembly, IElement, Joint, isElement, isFrame} from '@gd/IElements';
import {INamedVector3, IDataMatrix3, IDataVector3} from '@gd/INamedValues';
import {trans} from '@gd/Elements';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';
import Vector from '@gdComponents/Vector';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import AddBoxIcon from '@mui/icons-material/AddBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import Toolbar from '@mui/material/Toolbar';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {alpha} from '@mui/material/styles';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
// import {getNode} from '@gd/INode';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {NumberToRGB, toFixedNoZero} from '@app/utils/helpers';
import {getMatrix3, getDataVector3} from '@gd/NamedValues';

interface Params {
  assembly: IAssembly;
}
type PointPair = {
  lhs: {parentNodeID: string; selected: number; nodeID: string} | null;
  rhs: {parentNodeID: string; selected: number; nodeID: string} | null;
};

interface IDataVector3WithColor extends IDataVector3 {
  color: number;
}

export default function AssemblyConfig(params: Params) {
  const {assembly} = params;

  const {children} = assembly;
  const jointedNodeIDs = assembly.getJointedPoints().map((p) => p.nodeID);
  const restOfPointsChildren: {[name: string]: INamedVector3[]} =
    assembly.children.reduce(
      (obj, x) =>
        Object.assign(obj, {
          [x.nodeID]: x
            .getPoints()
            .filter((p) => !jointedNodeIDs.includes(p.nodeID))
        }),
      {}
    );

  const [jointsListSelected, setJointsListSelected] = React.useState<
    number | null
  >(null);
  const [pointSelected, setPointSelected] = React.useState<PointPair>({
    lhs: null,
    rhs: null
  });
  const dispatch = useDispatch();
  const kinematicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.parameterConfigState.kinematicParamsExpanded
  );
  const dynamicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.parameterConfigState.dynamicParamsExpanded
  );

  React.useEffect(() => {
    setJointsListSelected(null);
    setPointSelected({lhs: null, rhs: null});
  }, [assembly.joints.length]);

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  dispatch(setSelectedPoint({point: null}));

  let points: IDataVector3WithColor[] = [
    ...assembly.getPoints().map((p) => ({
      ...getDataVector3(trans(p).applyMatrix3(coMatrix)),
      color: 0x0000ff
    })),
    ...assembly.getJointedPoints().map((p) => ({
      ...getDataVector3(trans(p).applyMatrix3(coMatrix)),
      color: 0xffff00
    }))
  ];
  if (jointsListSelected !== null) {
    const joint = assembly.joints.find(
      (joint, idx) => idx === jointsListSelected
    );
    if (joint) {
      points = [
        ...points,
        {
          ...getDataVector3(trans(joint.lhs).applyMatrix3(coMatrix)),
          color: 0xff0000
        },
        {
          ...getDataVector3(trans(joint.rhs).applyMatrix3(coMatrix)),
          color: 0xff0000
        }
      ];
    }
  }
  if (pointSelected !== null) {
    const tmp = assembly.getPoints();
    const lhs = tmp.find((point) => point.nodeID === pointSelected.lhs?.nodeID);
    const rhs = tmp.find((point) => point.nodeID === pointSelected.rhs?.nodeID);
    if (lhs) {
      points = [
        ...points,
        {...getDataVector3(trans(lhs).applyMatrix3(coMatrix)), color: 0xff0000}
      ];
    }
    if (rhs) {
      points = [
        ...points,
        {...getDataVector3(trans(rhs).applyMatrix3(coMatrix)), color: 0xff0000}
      ];
    }
  }

  dispatch(setSelectedPoint({point: points}));

  return (
    <>
      <Typography variant="h6">{assembly.name.value} Parameters</Typography>
      <Accordion
        defaultExpanded={kinematicParamsDefaultExpanded}
        onChange={(e, expanded) => {
          dispatch(kinematicParamsDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Kinematic Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}}>
          <Vector
            vector={assembly.initialPosition}
            offset={assembly.position.value}
            rotation={assembly.rotation.value}
          />
          <JointsList
            assembly={assembly}
            selected={jointsListSelected}
            setSelected={(value) => {
              setJointsListSelected(value);
              setPointSelected({lhs: null, rhs: null});
            }}
            selectedPair={pointSelected}
          />
          {children.map((child) => {
            return (
              <RestOfPoints
                element={child}
                points={restOfPointsChildren[child.nodeID]}
                selected={pointSelected}
                setSelected={(value) => {
                  setPointSelected(value);
                  setJointsListSelected(null);
                }}
              />
            );
          })}
        </AccordionDetails>
      </Accordion>
      <Accordion
        defaultExpanded={dynamicParamsDefaultExpanded}
        onChange={(e, expanded) => {
          dispatch(dynamicParamsDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
          id="panel2a-header"
        >
          <Typography>Dynamic Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>TBD</Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
          id="panel3a-header"
        >
          <Typography>Visualization</Typography>
        </AccordionSummary>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
          id="panel3a-header"
        >
          <Typography>Other Configurations</Typography>
        </AccordionSummary>
      </Accordion>
    </>
  );
}

export function JointsList(props: {
  assembly: IAssembly;
  selected: number | null;
  setSelected: (value: number | null) => void;
  selectedPair: PointPair;
}) {
  const {assembly, selected, setSelected, selectedPair} = props;
  let pairSelected = Boolean(selectedPair.lhs && selectedPair.rhs);
  let varidatedSelected = selected;
  if (isFrame(assembly)) {
    pairSelected = false;
    varidatedSelected = null;
  }

  const {joints} = assembly;
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );
  const dispatch = useDispatch();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (pairSelected) buttonRef.current?.focus();
  }, [pairSelected]);

  return (
    <Box>
      <Toolbar
        sx={{
          pl: '0.8rem!important',
          pr: '0.3rem!important',
          pb: '0rem!important',
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
          Jointed Points
        </Typography>
        {varidatedSelected !== null ? (
          <Tooltip title="Delete" sx={{flex: '1'}}>
            <IconButton
              onClick={() => {
                assembly.joints = joints.filter((joint, i) => i !== selected);
                dispatch(updateAssembly(assembly));
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {pairSelected ? (
          <Tooltip title="Add" sx={{flex: '1'}}>
            <IconButton
              onClick={() => {
                const points = assembly.getPoints();
                const lhs = points.find(
                  (point) => point.nodeID === selectedPair.lhs?.nodeID
                );
                const rhs = points.find(
                  (point) => point.nodeID === selectedPair.rhs?.nodeID
                );
                if (lhs && rhs) {
                  assembly.joints.push({lhs, rhs});
                  dispatch(updateAssembly(assembly));
                }
              }}
              ref={buttonRef}
            >
              <AddBoxIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </Toolbar>
      <Paper
        elevation={6}
        sx={{
          mt: 0.3,
          mb: 1.5,
          ml: 2,
          mr: 2
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: alpha('#EEE8AA', 0.2),
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
            <TableHead onClick={() => setSelected(null)}>
              <TableRow>
                <TableCell>LHS Name</TableCell>
                <TableCell>LHS Parent</TableCell>
                <TableCell>RHS Name</TableCell>
                <TableCell>RHS Parent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {joints?.map((joint, idx) => {
                return (
                  <TableRow
                    key={joint.lhs.nodeID}
                    sx={{
                      '&:last-child td, &:last-child th': {border: 0},
                      userSelect: 'none',
                      backgroundColor:
                        selected === idx
                          ? alpha(NumberToRGB(enabledColorLight), 0.5)
                          : 'unset'
                    }}
                    onClick={() => {
                      setSelected(idx);
                    }}
                  >
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {joint.lhs.name}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {joint.lhs.parent.getName()}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {joint.rhs.name}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {joint.rhs.parent.getName()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export function RestOfPoints(props: {
  element: IElement;
  points: INamedVector3[];
  selected: PointPair;
  setSelected: (value: PointPair) => void;
}) {
  const {element, points, selected, setSelected} = props;
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );
  const cancel = () => {
    if (selected.lhs?.parentNodeID === element.nodeID) {
      selected.lhs = null;
      setSelected({...selected});
    }
    if (selected.rhs?.parentNodeID === element.nodeID) {
      selected.rhs = null;
      setSelected({...selected});
    }
  };
  const isSelected = (idx: number = -1) => {
    return (
      (selected.lhs?.parentNodeID === element.nodeID &&
        (idx === -1 || selected.lhs?.selected === idx)) ||
      (selected.rhs?.parentNodeID === element.nodeID &&
        (idx === -1 || selected.rhs?.selected === idx))
    );
  };

  return (
    <Box>
      <Toolbar
        sx={{
          pl: '0.8rem!important',
          pr: '0.3rem!important',
          pb: '0rem!important',
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
          {element.name.value}&apos;s Points
        </Typography>
        {isSelected() ? (
          <Tooltip title="Delete" sx={{flex: '1'}}>
            <IconButton onClick={cancel}>
              <IndeterminateCheckBoxIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </Toolbar>
      <Paper
        elevation={6}
        sx={{
          mt: 0.3,
          mb: 1.5,
          ml: 2,
          mr: 2
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: alpha('#FFF0F5', 0.8),
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
            <TableHead onClick={cancel}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>AbsPath</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {points?.map((point, idx) => {
                return (
                  <TableRow
                    key={point.nodeID}
                    sx={{
                      '&:last-child td, &:last-child th': {border: 0},
                      userSelect: 'none',
                      backgroundColor: isSelected(idx)
                        ? alpha(NumberToRGB(enabledColorLight), 0.5)
                        : 'unset'
                    }}
                    onClick={() => {
                      if (
                        (!selected.lhs &&
                          selected.rhs?.parentNodeID !== element.nodeID) ||
                        selected.lhs?.parentNodeID === element.nodeID
                      ) {
                        selected.lhs = {
                          parentNodeID: element.nodeID,
                          selected: idx,
                          nodeID: point.nodeID
                        };
                        setSelected({...selected});
                      } else {
                        selected.rhs = {
                          parentNodeID: element.nodeID,
                          selected: idx,
                          nodeID: point.nodeID
                        };
                        setSelected({...selected});
                      }
                    }}
                  >
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {point.name}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {point.parent.getName()}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {point.getNamedAbsPath()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
