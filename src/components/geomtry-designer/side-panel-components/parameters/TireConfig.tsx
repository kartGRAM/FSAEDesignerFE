import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {ITire, isMirrorElement} from '@gd/IElements';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';
import Vector from '@gdComponents/Vector';
import Scalar from '@gdComponents/Scalar';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import ElementName from './ElementName';

interface Params {
  element: ITire;
}

export default function TireConfig(params: Params) {
  const {element} = params;
  const isMirror = isMirrorElement(element);
  // eslint-disable-next-line no-unused-vars

  const dispatch = useDispatch();
  const kinematicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.parameterConfigState.kinematicParamsExpanded
  );
  const dynamicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.parameterConfigState.dynamicParamsExpanded
  );

  const onLeftBearingFocusChanged = React.useCallback(
    (focus: boolean) => {
      if (focus)
        dispatch(
          setSelectedPoint({
            point: element.leftBearing
          })
        );
      return () => {
        // if (!focus) dispatch(setSelectedPoint(null));
      };
    },
    [element]
  );
  const onRightBearingFocusChanged = React.useCallback(
    (focus: boolean) => {
      if (focus)
        dispatch(
          setSelectedPoint({
            point: element.rightBearing
          })
        );
      return () => {
        // if (!focus) dispatch(setSelectedPoint(null));
      };
    },
    [element]
  );

  React.useEffect(() => {
    dispatch(setSelectedPoint(null));
  }, []);

  return (
    <>
      <ElementName element={element} />
      <Accordion
        TransitionProps={{unmountOnExit: true}}
        expanded={kinematicParamsDefaultExpanded}
        onChange={(e, expanded) => {
          dispatch(kinematicParamsDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>
            Kinematic Parameters {isMirror ? '(Readonly)' : ''}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}}>
          <Vector vector={element.tireCenter} disabled={isMirror} />
          <Scalar
            onFocusChanged={onLeftBearingFocusChanged}
            value={element.toLeftBearing}
            unit="mm"
            disabled={isMirror}
          />
          <Scalar
            onFocusChanged={onRightBearingFocusChanged}
            value={element.toRightBearing}
            unit="mm"
            disabled={isMirror}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion
        TransitionProps={{unmountOnExit: true}}
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
          <Typography>WIP</Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion TransitionProps={{unmountOnExit: true}}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
        >
          <Typography>Visualization</Typography>
        </AccordionSummary>
      </Accordion>
      <Accordion TransitionProps={{unmountOnExit: true}}>
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
