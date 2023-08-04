/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {numberToRgb} from '@app/utils/helpers';
import {useSelector, useDispatch} from 'react-redux';
import {setSelectedMeasureTool} from '@store/reducers/uiTempGeometryDesigner';
import {measureToolsAccordionDefaultExpandedChange} from '@store/reducers/uiGeometryDesigner';
import {setMeasureTools} from '@store/reducers/dataGeometryDesigner';
import {RootState} from '@store/store';
import {alpha} from '@mui/material/styles';
import {IMeasureTool} from '@gd/measure/IMeasureTools';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Visibility from '@gdComponents/svgs/Visibility';
import {v4 as uuidv4} from 'uuid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import {useAnimationFrame} from '@hooks/useAnimationFrame';
import {MeasureToolDialog} from './MeasureToolDialog';

export default function MeasureToolsManager() {
  const dispatch = useDispatch();

  const measureToolsAccExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.measurePanelState.MeasureToolsExpanded
  );

  const measureToolsManager = useSelector(
    (state: RootState) => state.uitgd.measureToolsManager
  );

  const tools = measureToolsManager?.children ?? [];

  const update = (tools: IMeasureTool[]) => {
    const dataTools = tools.map((tool) => tool.getData());
    dispatch(setMeasureTools(dataTools));
  };

  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const selected = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.selectedMeasureTool
  );

  const [dialogTarget, setDialogTarget] = React.useState<string>('');

  const onToolDblClick = (tool: IMeasureTool | undefined) => {
    let id = 'new';
    if (tool) id = tool.nodeID;
    dispatch(setSelectedMeasureTool(''));
    setDialogTarget(id);
  };

  const dialogTargetTool = tools.find((tool) => tool.nodeID === dialogTarget);

  const onMeasureToolDialogApply = (tool: IMeasureTool) => {
    if (!measureToolsManager) return;
    if (dialogTargetTool) {
      dialogTargetTool.copy(tool);
    } else {
      tools.push(tool);
      setDialogTarget(`new${uuidv4()}`);
    }
    update(tools);
  };

  const onDelete = () => {
    update(tools.filter((tool) => selected !== tool.nodeID));
  };

  React.useEffect(() => {
    return () => {
      dispatch(setSelectedMeasureTool(''));
    };
  }, []);

  const tooltipZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.tooltipZIndex
  );

  return (
    <>
      <Accordion
        sx={{
          '.MuiAccordionSummary-content': {
            mt: 0,
            mb: 0
          },
          minHeight: 0,
          '.Mui-expanded': {
            mt: 1,
            mb: 1
          }
        }}
        TransitionProps={{unmountOnExit: true}}
        expanded={measureToolsAccExpanded}
        onChange={(e, expanded) => {
          if (!expanded) dispatch(setSelectedMeasureTool(''));
          dispatch(measureToolsAccordionDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
          sx={{
            userSelect: 'none',
            '&.Mui-focusVisible': {
              backgroundColor: 'unset'
            }
          }}
        >
          <Toolbar
            sx={{
              pl: '0!important',
              pr: '1rem!important',
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
              Measure Tools
            </Typography>
            {measureToolsAccExpanded && tools.length > 0 ? (
              <Tooltip
                title="Add a new measure tool."
                sx={{flex: '1'}}
                componentsProps={{
                  popper: {
                    sx: {
                      zIndex: tooltipZIndex
                    }
                  }
                }}
              >
                <span>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onToolDblClick(undefined);
                    }}
                  >
                    <AddBoxIcon />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
            {selected !== '' ? (
              <Tooltip
                title="Delete a selected tool"
                sx={{flex: '1'}}
                componentsProps={{
                  popper: {
                    sx: {
                      zIndex: tooltipZIndex
                    }
                  }
                }}
              >
                <span>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </Toolbar>
        </AccordionSummary>
        <AccordionDetails sx={{pt: 0, pb: 1, pl: 1, pr: 1}}>
          {tools.length === 0 ? (
            <Box
              component="div"
              display="flex"
              alignItems="center"
              justifyContent="center"
              padding={3}
            >
              <Button
                variant="contained"
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                  onToolDblClick(undefined);
                }}
              >
                Create A New Measure Tool
              </Button>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                '& ::-webkit-scrollbar': {
                  height: '10px'
                },
                '&  ::-webkit-scrollbar-thumb': {
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
                <TableHead>
                  <TableRow
                    onClick={() => dispatch(setSelectedMeasureTool(''))}
                  >
                    <TableCell>Order</TableCell>
                    <TableCell align="left">Visibility</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell align="left">description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tools?.map((tool, idx) => {
                    return (
                      <TableRow
                        key={tool.nodeID}
                        sx={{
                          '&:last-child td, &:last-child th': {border: 0},
                          userSelect: 'none',
                          backgroundColor:
                            selected === tool.nodeID
                              ? alpha(numberToRgb(enabledColorLight), 0.5)
                              : 'unset'
                        }}
                        onClick={() => {
                          if (tool.nodeID !== selected) {
                            dispatch(setSelectedMeasureTool(tool.nodeID));
                          }
                        }}
                        onDoubleClick={() => onToolDblClick(tool)}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell align="left">
                          <Visibility
                            visible={tool.visibility}
                            onClick={() => {
                              tool.visibility = !tool.visibility;
                              update(tools);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{whiteSpace: 'nowrap'}}>
                          {tool.name}
                        </TableCell>
                        <TableCell sx={{whiteSpace: 'nowrap'}}>
                          <ToolValue tool={tool} />
                        </TableCell>
                        <TableCell align="left">{tool.description}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>
      <MeasureToolDialog
        open={dialogTarget !== ''}
        close={() => {
          setDialogTarget('');
          update(tools);
        }}
        apply={onMeasureToolDialogApply}
        tool={dialogTargetTool}
        key={dialogTargetTool?.nodeID ?? dialogTarget}
      />
    </>
  );
}

function ToolValue(props: {tool: IMeasureTool}) {
  const {tool} = props;

  const keys = Object.keys(tool.value);
  const refs = React.useRef(keys.map(() => React.createRef<HTMLSpanElement>()));
  useAnimationFrame(() => {
    keys.forEach((key, i) => {
      const span = refs.current[i].current;
      if (!span) return;
      if (keys.length === 1) {
        span.innerText = tool.value[key].toFixed(3);
      } else {
        span.innerText = `${key}:  ${tool.value[key].toFixed(3)}`;
      }
    });
  });

  if (keys.length === 1) {
    return (
      <Typography ref={refs.current[0]} variant="caption">
        {tool.value[keys[0]].toFixed(3)}
      </Typography>
    );
  }
  return (
    <>
      {keys.map((key, i) => (
        <Box component="div">
          <Typography ref={refs.current[i]} variant="caption" key={key}>
            {`${key}:  ${tool.value[key].toFixed(3)}`}
          </Typography>
        </Box>
      ))}
    </>
  );
}
