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
import store, {RootState} from '@store/store';
import {alpha} from '@mui/material/styles';
import {IMeasureTool} from '@gd/measure/measureTools/IMeasureTools';
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
import useUpdate from '@hooks/useUpdate';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';
import {MeasureToolDialog} from './MeasureToolDialog';

export default function MeasureToolsManager() {
  const dispatch = useDispatch();
  const updateState = useUpdate();

  const measureToolsAccExpanded =
    store.getState().uigd.present.measurePanelState.MeasureToolsExpanded;

  const measureToolsManager = useSelector(
    (state: RootState) => state.uitgd.measureToolsManager
  );

  const tools = measureToolsManager?.children ?? [];

  const update = React.useCallback(() => {
    if (!measureToolsManager) return;
    const dataTools = measureToolsManager.children.map((tool) =>
      tool.getData()
    );
    dispatch(setMeasureTools(dataTools));
  }, [measureToolsManager]);

  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const selected = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.selectedMeasureTool
  );

  const [dialogTarget, setDialogTarget] = React.useState<string>('');

  const onToolDblClick = React.useCallback((tool: IMeasureTool | undefined) => {
    let id = 'new';
    if (tool) id = tool.nodeID;
    dispatch(setSelectedMeasureTool(''));
    setDialogTarget(id);
  }, []);

  const dialogTargetTool = tools.find((tool) => tool.nodeID === dialogTarget);

  const onMeasureToolDialogApply = (tool: IMeasureTool) => {
    if (!measureToolsManager) return;
    if (dialogTargetTool) {
      dialogTargetTool.copy(tool);
    } else {
      tools.push(tool);
      setDialogTarget(`new${uuidv4()}`);
    }
    update();
  };

  const onDelete = () => {
    if (!measureToolsManager) return;
    measureToolsManager.children = tools.filter(
      (tool) => selected !== tool.nodeID
    );
    update();
  };

  React.useEffect(() => {
    return () => {
      dispatch(setSelectedMeasureTool(''));
    };
  }, []);

  const {uitgd} = store.getState();
  const tooltipZIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;

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
        defaultExpanded={measureToolsAccExpanded}
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
                    <TableCell align="left">Visibility</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell align="left">description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tools?.map((tool) => (
                    <Row
                      tool={tool}
                      key={tool.nodeID}
                      onToolDblClick={onToolDblClick}
                      update={update}
                    />
                  ))}
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
          updateState();
        }}
        apply={onMeasureToolDialogApply}
        tool={dialogTargetTool}
        key={dialogTargetTool?.nodeID ?? dialogTarget}
      />
    </>
  );
}

const Row = React.memo(
  (props: {
    tool: IMeasureTool;
    onToolDblClick: (tool: IMeasureTool | undefined) => void;
    update: () => void;
  }) => {
    const {tool, onToolDblClick, update} = props;

    const dispatch = useDispatch();
    const selected = useSelector(
      (state: RootState) => state.uitgd.gdSceneState.selectedMeasureTool
    );

    const handleClick = React.useCallback(() => {
      if (tool.nodeID !== selected) {
        dispatch(setSelectedMeasureTool(tool.nodeID));
      }
    }, [tool, selected]);

    const enabledColorLight: number = useSelector(
      (state: RootState) => state.uigd.present.enabledColorLight
    );
    return (
      <TableRow
        sx={{
          '&:last-child td, &:last-child th': {border: 0},
          userSelect: 'none',
          backgroundColor:
            selected === tool.nodeID
              ? alpha(numberToRgb(enabledColorLight), 0.5)
              : 'unset'
        }}
        onClick={handleClick}
        onFocus={handleClick}
        onDoubleClick={() => onToolDblClick(tool)}
      >
        <TableCell align="left">
          <Visibility
            visible={tool.visibility}
            onClick={() => {
              tool.visibility = !tool.visibility;
              update();
            }}
          />
        </TableCell>
        <TableCell sx={{whiteSpace: 'nowrap'}}>
          <EditableTypography
            typography={tool.name}
            initialValue={tool.name}
            validation={Yup.string().required('required')}
            onSubmit={(value) => {
              if (tool.name !== value) {
                tool.name = value;
                update();
              }
            }}
            disableDblClickToEditMode
            textFieldProps={{
              sx: {
                '& legend': {display: 'none'},
                '& fieldset': {top: 0},
                width: '100%'
              }
            }}
          />
        </TableCell>
        <TableCell sx={{whiteSpace: 'nowrap'}}>
          <ToolValue tool={tool} />
        </TableCell>
        <TableCell align="left">{tool.description}</TableCell>
      </TableRow>
    );
  }
);

const ToolValue = React.memo((props: {tool: IMeasureTool}) => {
  const {tool} = props;

  const keys = Object.keys(tool.value);
  const refs = React.useRef(keys.map(() => React.createRef<HTMLSpanElement>()));
  const frameRef = React.useRef<number>(0);
  useAnimationFrame(() => {
    if (++frameRef.current % 3 !== 0) return;
    frameRef.current = 0;
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
        <Box component="div" key={key}>
          <Typography ref={refs.current[i]} variant="caption" key={key}>
            {`${key}:  ${tool.value[key].toFixed(3)}`}
          </Typography>
        </Box>
      ))}
    </>
  );
});
