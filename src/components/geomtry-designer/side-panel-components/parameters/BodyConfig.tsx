import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {IBody} from '@gd/IElements';
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

interface Params {
  element: IBody;
}

export default function AArmConfig(params: Params) {
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
          <Divider textAlign="left">Fixed Points</Divider>
          <Typography variant="caption" display="block" sx={{pl: 2}}>
            List here the fixed points for unit testing, such as I/F with the
            parent component.
          </Typography>
          {element.fixedPoints.map((point, i) => (
            <Vector
              key={point.name}
              vector={point}
              offset={element.position.value}
              rotation={element.rotation.value}
              removable
              onRemove={() => {
                element.fixedPoints.splice(i, 1);
                dispatch(updateAssembly(element));
              }}
            />
          ))}
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
              Additional Fixed Points
            </Typography>
            <Tooltip title="Add" sx={{flex: '1'}}>
              <IconButton
                onClick={() => {
                  const l = element.fixedPoints.length + 1;
                  element.fixedPoints.push(
                    new NamedVector3({
                      name: `fixedPoints${l}`,
                      parent: element,
                      value: {x: 0, y: 0, z: 0}
                    })
                  );
                  dispatch(updateAssembly(element));
                }}
              >
                <AddBoxIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
          <Divider textAlign="left">Non Fixed Points</Divider>
          <Typography variant="caption" display="block" sx={{pl: 2}}>
            List here the points that are I/F with the child components or the
            points to use to drive the unit.
          </Typography>
          {element.points.map((point, i) => (
            <Vector
              key={point.name}
              vector={point}
              offset={element.position.value}
              rotation={element.rotation.value}
              removable
              onRemove={() => {
                element.points.splice(i, 1);
                dispatch(updateAssembly(element));
              }}
            />
          ))}
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
              Additional Non Fixed Points
            </Typography>
            <Tooltip title="Add" sx={{flex: '1'}}>
              <IconButton
                onClick={() => {
                  const l = element.points.length + 1;
                  element.points.push(
                    new NamedVector3({
                      name: `point${l}`,
                      parent: element,
                      value: {x: 0, y: 0, z: 0}
                    })
                  );
                  dispatch(updateAssembly(element));
                }}
              >
                <AddBoxIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
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
