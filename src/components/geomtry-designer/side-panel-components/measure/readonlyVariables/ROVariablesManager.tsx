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
import {setSelectedROVariable} from '@store/reducers/uiTempGeometryDesigner';
import {roVariablesAccordionDefaultExpandedChange} from '@store/reducers/uiGeometryDesigner';
import {setReadonlyVariables} from '@store/reducers/dataGeometryDesigner';
import store, {RootState} from '@store/store';
import {alpha} from '@mui/material/styles';
import {IReadonlyVariable} from '@gd/measure/readonlyVariables/IReadonlyVariable';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {v4 as uuidv4} from 'uuid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import {useAnimationFrame} from '@hooks/useAnimationFrame';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';
import {ROVariableDialog} from './ROVariableDialog';

export default function ROVariablesManager() {
  const dispatch = useDispatch();

  const roVariablesAccExpanded =
    store.getState().uigd.present.measurePanelState.ROVariablesExpanded;

  const roVariablesManager = useSelector(
    (state: RootState) => state.uitgd.roVariablesManager
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const variables = roVariablesManager?.children ?? [];

  const update = React.useCallback(
    (newVariables?: IReadonlyVariable[]) => {
      if (!newVariables) newVariables = variables;
      const dataVars = newVariables.map((v) => v.getData());
      dispatch(setReadonlyVariables(dataVars));
    },
    [dispatch, variables]
  );

  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const selected = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.selectedROVariable
  );

  const [dialogTarget, setDialogTarget] = React.useState<string>('');
  const [newMode, setNewMode] = React.useState<string>('');

  const onVariableDblClick = (variable?: IReadonlyVariable) => {
    if (variable) {
      setDialogTarget(variable.nodeID);
      setNewMode('');
    } else {
      setNewMode(uuidv4());
      setDialogTarget('');
    }
    dispatch(setSelectedROVariable(''));
  };

  const index = variables.findIndex((v) => v.nodeID === dialogTarget);
  const dialogTargetVariable = index !== -1 ? variables[index] : undefined;
  const selectableVariables =
    index !== -1 ? variables.slice(0, index) : variables;

  const onROVariableDialogApply = (variable: IReadonlyVariable) => {
    if (!roVariablesManager) return;
    if (dialogTargetVariable) {
      dialogTargetVariable.copy(variable);
    } else {
      variables.push(variable);
      setDialogTarget(variable.nodeID);
    }
    update(variables);
  };

  const onDelete = () => {
    update(variables.filter((v) => selected !== v.nodeID));
  };

  React.useEffect(() => {
    return () => {
      dispatch(setSelectedROVariable(''));
    };
  }, [dispatch]);

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
        defaultExpanded={roVariablesAccExpanded}
        onChange={(e, expanded) => {
          if (!expanded) dispatch(setSelectedROVariable(''));
          dispatch(roVariablesAccordionDefaultExpandedChange(expanded));
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
              Readonly Variables
            </Typography>
            {variables.length > 0 ? (
              <Tooltip
                title="Add a new readonly variable."
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
                      onVariableDblClick(undefined);
                    }}
                  >
                    <AddBoxIcon />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
            {selected !== '' ? (
              <Tooltip
                title="Delete a selected variable"
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
          {variables.length === 0 ? (
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
                  onVariableDblClick(undefined);
                }}
              >
                Create A New Readonly Variable
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
                  <TableRow onClick={() => dispatch(setSelectedROVariable(''))}>
                    <TableCell>Name</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variables?.map((v) => (
                    <Row
                      v={v}
                      onVariableDblClick={onVariableDblClick}
                      update={update}
                      key={v.nodeID}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>
      <ROVariableDialog
        open={dialogTarget !== '' || newMode !== ''}
        close={() => {
          setDialogTarget('');
          setNewMode('');
        }}
        apply={onROVariableDialogApply}
        variable={dialogTargetVariable}
        selectableVariables={selectableVariables}
        key={newMode !== '' ? newMode : dialogTarget}
      />
    </>
  );
}

const Row = React.memo(
  (props: {
    v: IReadonlyVariable;
    onVariableDblClick: (v: IReadonlyVariable | undefined) => void;
    update: () => void;
  }) => {
    const {v, onVariableDblClick, update} = props;
    const dispatch = useDispatch();

    const enabledColorLight: number = useSelector(
      (state: RootState) => state.uigd.present.enabledColorLight
    );

    const selected = useSelector(
      (state: RootState) => state.uitgd.gdSceneState.selectedROVariable
    );

    const handleClick = React.useCallback(() => {
      if (v.nodeID !== selected) {
        dispatch(setSelectedROVariable(v.nodeID));
      }
    }, [v.nodeID, selected, dispatch]);

    return (
      <TableRow
        sx={{
          '&:last-child td, &:last-child th': {border: 0},

          userSelect: 'none',

          backgroundColor:
            selected === v.nodeID
              ? alpha(numberToRgb(enabledColorLight), 0.5)
              : 'unset'
        }}
        onClick={handleClick}
        onFocus={handleClick}
        onDoubleClick={() => onVariableDblClick(v)}
      >
        <TableCell sx={{whiteSpace: 'nowrap'}}>
          <EditableTypography
            typography={v.name}
            initialValue={v.name}
            validation={Yup.string().required('required')}
            onSubmit={(value) => {
              if (v.name !== value) {
                v.name = value;
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
          <ToolValue variable={v} />
        </TableCell>
      </TableRow>
    );
  }
);

function ToolValue(props: {variable: IReadonlyVariable}) {
  const {variable} = props;

  const ref = React.useRef<HTMLSpanElement>(null);
  const frameRef = React.useRef<number>(0);
  useAnimationFrame(() => {
    if (++frameRef.current % 3 !== 0) return;
    frameRef.current = 0;
    const span = ref.current;
    if (!span) return;
    span.innerText = variable.value.toFixed(3);
  });

  return (
    <Box component="div">
      <Typography ref={ref} variant="caption">
        {`${variable.value.toFixed(3)}`}
      </Typography>
    </Box>
  );
}
