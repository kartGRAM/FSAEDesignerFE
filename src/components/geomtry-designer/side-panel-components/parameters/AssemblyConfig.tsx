/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {IAssembly, IElement, Joint} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
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
import {alpha} from '@mui/material/styles';

import {NumberToRGB, toFixedNoZero} from '@app/utils/helpers';

interface Params {
  assembly: IAssembly;
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

  const dispatch = useDispatch();
  const kinematicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.parameterConfigState.kinematicParamsExpanded
  );
  const dynamicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.parameterConfigState.dynamicParamsExpanded
  );

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
          <JointsList joints={assembly.joints} />
          {children.map((child) => {
            return (
              <RestOfPoints
                element={child}
                points={restOfPointsChildren[child.nodeID]}
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

export function JointsList(props: {joints: Joint[]}) {
  const {joints} = props;
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const [selected, setSelected] = React.useState<number | null>(null);
  return (
    <Box>
      <Typography
        sx={{
          flex: '1 1 100%',
          pl: 1.5,
          pr: 1.5,
          pb: 0.5
        }}
        color="inherit"
        variant="subtitle1"
        component="div"
      >
        Jointed Points
      </Typography>
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
                    key={joint.lhs.name}
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
}) {
  const {element, points} = props;
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const [selected, setSelected] = React.useState<number | null>(null);
  return (
    <Box>
      <Typography
        sx={{
          flex: '1 1 100%',
          pl: 1.5,
          pr: 1.5,
          pb: 0.5
        }}
        color="inherit"
        variant="subtitle1"
        component="div"
      >
        {element.name.value}&apos;s Points
      </Typography>
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
            <TableHead onClick={() => setSelected(null)}>
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
                    key={point.name}
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
                      {point.name}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {point.parent.getName()}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {point.absPath}
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
