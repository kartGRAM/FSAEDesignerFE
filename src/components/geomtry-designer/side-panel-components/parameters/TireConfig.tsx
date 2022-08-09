import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {ITire} from '@gd/IElements';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';
import Vector from '@gdComponents/Vector';
import Scalar from '@gdComponents/Scalar';

interface Params {
  element: ITire;
}

export default function TireConfig(params: Params) {
  const {element} = params;
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
  return (
    <>
      <Typography variant="h6">{element.name.value} Parameters</Typography>
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
            vector={element.tireCenter}
            offset={element.position.value}
            rotation={element.rotation.value}
          />
          <Scalar value={element.toLeftBearing} unit="mm" />
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
