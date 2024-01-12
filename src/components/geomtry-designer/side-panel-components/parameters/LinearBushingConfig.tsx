import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {isMirrorElement, getRootAssembly} from '@gd/IElements';
import {ILinearBushing} from '@gd/IElements/ILinearBushing';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {NamedNumber} from '@gd/NamedValues';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import {
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';
import Vector from '@gdComponents/Vector';
import Scalar from '@gdComponents/Scalar';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {MassAndCOG} from '@gdComponents/side-panel-components/parameters/MassAndCOG';
import ElementName from './ElementName';

interface Params {
  element: ILinearBushing;
}

export default function LinearBushingConfig(params: Params) {
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
          {element.toPoints.map((point, i) => (
            <Scalar
              value={point}
              unit="mm"
              disabled={isMirror}
              key={point.nodeID}
              removable={i > 0}
              onRemove={() => {
                element.toPoints.splice(i, 1);
                dispatch(updateAssembly(getRootAssembly(element)));
              }}
              onFocusChanged={(focus: boolean) => {
                if (focus)
                  dispatch(
                    setSelectedPoint({
                      point: element.points[i]
                    })
                  );
                return () => {
                  // if (!focus) dispatch(setSelectedPoint(null));
                };
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
                    const l = element.toPoints.length;
                    element.toPoints.push(
                      new NamedNumber({
                        name: `rodEnd${l + 1}`,
                        parent: element,
                        value: 0
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
          <Scalar value={element.dlMax} unit="mm" disabled={isMirror} />
          <Scalar value={element.dlMin} unit="mm" disabled={isMirror} />
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
