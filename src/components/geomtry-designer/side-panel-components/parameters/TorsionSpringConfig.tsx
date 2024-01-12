import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {isMirrorElement} from '@gd/IElements';
import {ITorsionSpring} from '@gd/IElements/ITorsionSpring';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';
import Vector from '@gdComponents/Vector';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {MassAndCOG} from '@gdComponents/side-panel-components/parameters/MassAndCOG';
import ElementName from './ElementName';

interface Params {
  element: ITorsionSpring;
}

export default function TorsionSpringConfig(params: Params) {
  const {element} = params;

  const isMirror = isMirrorElement(element);

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
    dispatch(setSelectedPoint(null));
  }, [dispatch]);

  return (
    <>
      <ElementName element={element} />
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
          <Vector vector={element.fixedPoints[0]} disabled={isMirror} />
          <Vector vector={element.fixedPoints[1]} disabled={isMirror} />
          {element.effortPoints.map((point, i) => (
            <Vector
              vector={point}
              disabled={isMirror}
              key={point.nodeID}
              onRemove={() => {
                element.effortPoints.splice(i, 1);
                dispatch(updateAssembly(element));
              }}
            />
          ))}
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
          <MassAndCOG element={element} />
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
