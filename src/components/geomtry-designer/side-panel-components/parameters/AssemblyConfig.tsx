import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {IAssembly, IElement, getRootAssembly} from '@gd/IElements';
import {isFrame /* isSimplifiedElement */} from '@gd/IElements/IFrame';
import {INamedVector3RO} from '@gd/INamedValues';
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
import {
  setSelectedPoint
  /* setConfirmDialogProps */
} from '@store/reducers/uiTempGeometryDesigner';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import {numberToRgb} from '@app/utils/helpers';
import usePrevious from '@app/hooks/usePrevious';
import {MassAndCOG} from '@gdComponents/side-panel-components/parameters/MassAndCOG';
import ElementName from './ElementName';

interface Params {
  assembly: IAssembly;
}
type PointPair = {
  lhs: {parentNodeID: string; selected: number; nodeID: string} | null;
  rhs: {parentNodeID: string; selected: number; nodeID: string} | null;
};

interface INamedVector3WithColor {
  point: INamedVector3RO;
  color: number;
  noFocus?: boolean;
}

export default function AssemblyConfig(params: Params) {
  const {assembly} = params;
  const isMirror = !!assembly.meta?.mirror;

  const {children} = assembly;
  const jointedNodeIDs = assembly.getJointedPoints().map((p) => p.nodeID);
  const restOfPointsChildren: {[name: string]: INamedVector3RO[]} =
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
      state.uigd.parameterConfigState.kinematicParamsExpanded
  );
  const dynamicParamsDefaultExpanded = useSelector(
    (state: RootState) => state.uigd.parameterConfigState.dynamicParamsExpanded
  );

  const jointsListSetSelected = React.useCallback((value: number | null) => {
    setJointsListSelected(value);
    setPointSelected({lhs: null, rhs: null});
  }, []);

  const restOfPointsSetSelected = React.useCallback((value: PointPair) => {
    setPointSelected(value);
    setJointsListSelected(null);
  }, []);

  const jointLength = usePrevious(
    assembly.joints.length,
    assembly.joints.length
  );

  let points: INamedVector3WithColor[] = [
    ...assembly.getPoints().map((p) => ({
      point: p,
      color: 0x00ff00
    })),
    ...assembly.getJointedPoints().map((p) => ({
      point: p,
      color: 0x0000ff
    }))
  ];

  // 最初の再レンダリングを回避
  React.useEffect(() => {
    setJointsListSelected(null);
    setPointSelected({lhs: null, rhs: null});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jointLength !== assembly.joints.length]);

  if (jointsListSelected !== null) {
    const joint = assembly
      .getJointsAsVector3()
      .find((joint, idx) => idx === jointsListSelected);
    if (joint) {
      points = [
        ...points.filter(
          (point) =>
            point.point.nodeID !== joint.lhs.nodeID &&
            point.point.nodeID !== joint.rhs.nodeID
        ),
        {
          point: joint.lhs,
          color: 0xff0000
        },
        {
          point: joint.rhs,
          color: 0xff0000
        }
      ];
    }
  }
  const tmp = assembly.getPoints();
  const lhs = tmp.find((point) => point.nodeID === pointSelected.lhs?.nodeID);
  const rhs = tmp.find((point) => point.nodeID === pointSelected.rhs?.nodeID);
  if (lhs) {
    points = [
      ...points.filter((point) => point.point.nodeID !== lhs.nodeID),
      {point: lhs, color: 0xff0000}
    ];
  }
  if (rhs) {
    points = [
      ...points.filter((point) => point.point.nodeID !== rhs.nodeID),
      {point: rhs, color: 0xff0000}
    ];
  }

  // 選択状態が変化したらポイントを再描写ただし初回も実施
  React.useEffect(() => {
    dispatch(setSelectedPoint(points));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jointsListSelected,
    pointSelected.lhs?.nodeID,
    pointSelected.rhs?.nodeID,
    assembly
  ]);

  let isFrameObject = false;
  if (isFrame(assembly)) isFrameObject = true;

  return (
    <>
      <ElementName element={assembly} />
      <Accordion
        expanded={kinematicParamsDefaultExpanded}
        onChange={(e, expanded) => {
          dispatch(kinematicParamsDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>
            Kinematic Parameters {isMirror ? '(Readonly)' : ''}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}}>
          {!isFrameObject ? (
            <Vector vector={assembly.initialPosition} disabled={isMirror} />
          ) : null}
          <JointsList
            assembly={assembly}
            selected={jointsListSelected}
            setSelected={jointsListSetSelected}
            selectedPair={pointSelected}
          />
          {!isFrameObject
            ? children.map((child) => {
                return (
                  <RestOfPoints
                    key={child.nodeID}
                    element={child}
                    points={restOfPointsChildren[child.nodeID]}
                    selected={pointSelected}
                    setSelected={restOfPointsSetSelected}
                  />
                );
              })
            : null}
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={dynamicParamsDefaultExpanded}
        onChange={(e, expanded) => {
          dispatch(dynamicParamsDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
        >
          <Typography>Dynamic Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <MassAndCOG element={assembly} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
        >
          <Typography>Visualization</Typography>
        </AccordionSummary>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
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

  const joints = assembly.getJointsAsVector3();
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.enabledColorLight
  );
  const dispatch = useDispatch();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (pairSelected) buttonRef.current?.focus();
  }, [pairSelected]);

  const resetSelected = React.useCallback(
    () => setSelected(null),
    [setSelected]
  );

  if (!!assembly.meta?.mirror || isFrame(assembly)) {
    pairSelected = false;
    varidatedSelected = null;
  }

  return (
    <Box component="div">
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
                assembly.joints = assembly.joints.filter(
                  (joint, i) => i !== selected
                );
                dispatch(updateAssembly(getRootAssembly(assembly)));
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {pairSelected ? (
          <Tooltip title="Add" sx={{flex: '1'}}>
            <IconButton
              onClick={async () => {
                const points = assembly.getPoints();
                const lhs = points.find(
                  (point) => point.nodeID === selectedPair.lhs?.nodeID
                );
                const rhs = points.find(
                  (point) => point.nodeID === selectedPair.rhs?.nodeID
                );
                if (lhs && rhs) {
                  assembly.joints.push({lhs: lhs.nodeID, rhs: rhs.nodeID});
                  dispatch(updateAssembly(getRootAssembly(assembly)));
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
            <TableHead onClick={resetSelected}>
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
                          ? alpha(numberToRgb(enabledColorLight), 0.5)
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
                      {joint.lhs.parent?.getName()}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {joint.rhs.name}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {joint.rhs.parent?.getName()}
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
  points: INamedVector3RO[];
  selected: PointPair;
  setSelected: (value: PointPair) => void;
}) {
  const {element, points, selected, setSelected} = props;
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.enabledColorLight
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
  const dispatch = useDispatch();

  return (
    <Box component="div">
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
          Points of {element.name.value}
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
                        ? alpha(numberToRgb(enabledColorLight), 0.5)
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
                    onDoubleClick={() => {
                      if (point.parent)
                        dispatch(
                          selectElement({absPath: point.parent.absPath})
                        );
                    }}
                  >
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {point.name}
                    </TableCell>
                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                      {point.parent?.getName()}
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
