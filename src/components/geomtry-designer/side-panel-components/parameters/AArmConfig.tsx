import React, {useEffect} from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {IAArm} from '@gd/IElements';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';
import {
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';
import Vector from '@gdComponents/Vector';

interface Params {
  element: IAArm;
}

export default function AArmConfig(params: Params) {
  const {element} = params;
  // eslint-disable-next-line no-unused-vars

  useEffect(() => {
    return () => {
      dispatch(setSelectedPoint({point: null}));
    };
  });

  const dispatch = useDispatch();
  const kinematicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.parameterConfigState.kinematicParamsExpanded
  );
  const dynamicParamsDefaultExpanded = useSelector(
    (state: RootState) => state.uigd.parameterConfigState.dynamicParamsExpanded
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
            element={element}
            vector={element.fixedPoints[0]}
            offset={element.position.value}
            rotation={element.rotation.value}
          />
          <Vector
            element={element}
            vector={element.fixedPoints[1]}
            offset={element.position.value}
            rotation={element.rotation.value}
          />
          <Vector
            element={element}
            vector={element.points[0]}
            offset={element.position.value}
            rotation={element.rotation.value}
          />
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
          <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            malesuada lacus ex, sit amet blandit leo lobortis eget.
          </Typography>
        </AccordionDetails>
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
