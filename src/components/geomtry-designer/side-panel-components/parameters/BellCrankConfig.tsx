import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {isMirrorElement, getRootAssembly} from '@gd/IElements';
import {IBellCrank} from '@gd/IElements/IBellCrank';

import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {NamedVector3} from '@gd/NamedValues';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';
import Vector from '@gdComponents/Vector';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {MassAndCOG} from '@gdComponents/side-panel-components/parameters/MassAndCOG';
import ElementName from './ElementName';

interface Params {
  element: IBellCrank;
}

export default function AArmConfig(params: Params) {
  const {element} = params;
  const isMirror = isMirrorElement(element);

  const dispatch = useDispatch();
  const kinematicParamsDefaultExpanded = useSelector(
    (state: RootState) =>
      state.uigd.parameterConfigState.kinematicParamsExpanded
  );
  const dynamicParamsDefaultExpanded = useSelector(
    (state: RootState) => state.uigd.parameterConfigState.dynamicParamsExpanded
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
          {element.points.map((point, i) => (
            <Vector
              isNode
              disabled={isMirror}
              key={point.name}
              vector={point}
              removable={i > 1}
              onRemove={() => {
                element.points.splice(i, 1);
                dispatch(updateAssembly(getRootAssembly(element)));
              }}
            />
          ))}
          {!isMirror ? (
            <Toolbar
              sx={{
                pr: '0.7rem!important',
                pl: '1rem!important',
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
                Additional Points
              </Typography>
              <Tooltip title="Add" sx={{flex: '1'}}>
                <IconButton
                  onClick={() => {
                    const l = element.points.length;
                    element.points.push(
                      new NamedVector3({
                        name: `attachedPoint${l}`,
                        parent: element,
                        value: {x: 0, y: 0, z: 0}
                      })
                    );
                    dispatch(updateAssembly(getRootAssembly(element)));
                  }}
                >
                  <AddBoxIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
          ) : null}
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
