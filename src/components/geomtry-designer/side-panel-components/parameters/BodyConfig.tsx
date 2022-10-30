import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {IBody, isMirrorElement} from '@gd/IElements';
import {useDispatch, useSelector} from 'react-redux';
import store, {RootState} from '@store/store';
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
import ElementName from './ElementName';

interface Params {
  element: IBody;
}

export default function AArmConfig(params: Params) {
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

  React.useEffect(() => {
    const point = store.getState().uitgd.gdSceneState.selectedPoint?.at(0);
    if (point && point.point.parent?.nodeID !== element.nodeID) {
      dispatch(setSelectedPoint(null));
    }
  }, []);

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
          {!element.meta?.isBodyOfFrame ? (
            <>
              <Divider textAlign="left">Fixed Points</Divider>
              <Typography variant="caption" display="block" sx={{pl: 2}}>
                List here the fixed points for component testing, such as I/F
                with the parent component.
              </Typography>
              {element.fixedPoints.map((point, i) => (
                <Vector
                  disabled={isMirror}
                  key={point.name}
                  vector={point}
                  removable
                  onRemove={() => {
                    element.fixedPoints.splice(i, 1);
                    dispatch(updateAssembly(element));
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
              ) : null}
              <Divider textAlign="left">Non Fixed Points</Divider>
              <Typography variant="caption" display="block" sx={{pl: 2}}>
                List here points that are I/F with child components or points to
                use actuating this component.
              </Typography>
              {element.points.map((point, i) => (
                <Vector
                  isNode
                  disabled={isMirror}
                  key={point.name}
                  vector={point}
                  removable
                  onRemove={() => {
                    element.points.splice(i, 1);
                    dispatch(updateAssembly(element));
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
              ) : null}
            </>
          ) : (
            <Typography variant="caption" display="block" sx={{pl: 2}}>
              This is a component of Frame Object. The component points are
              generated automatically.
            </Typography>
          )}
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
