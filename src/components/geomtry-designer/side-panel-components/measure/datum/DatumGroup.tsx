import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {numberToRgb} from '@app/utils/helpers';
import {useSelector, useDispatch} from 'react-redux';
import {setSelectedDatumObject} from '@store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {alpha} from '@mui/material/styles';
import {IDatumGroup, IDatumObject} from '@gd/measure/datum/IDatumObjects';
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
import useUpdate from '@hooks/useUpdate';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';
import Typography from '@mui/material/Typography';
import {DatumDialog} from './DatumDialog';

export const DatumGroupTable = React.memo(
  (props: {
    datumGroup: IDatumGroup;
    expanded: boolean;
    setExpanded: React.Dispatch<React.SetStateAction<string>>;
    update: () => void;
  }) => {
    const {datumGroup, setExpanded, update} = props;
    const {expanded} = props;
    const dispatch = useDispatch();
    const updateState = useUpdate();

    const enabledColorLight: number = useSelector(
      (state: RootState) => state.uigd.enabledColorLight
    );

    const selected = useSelector(
      (state: RootState) => state.uitgd.gdSceneState.selectedDatumObject
    );

    const [dialogTarget, setDialogTarget] = React.useState<string>('');
    const datumObjects = datumGroup.children;

    const {uitgd} = store.getState();
    const tooltipZIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;

    const onDatumDblClick = React.useCallback(
      (datum: IDatumObject | undefined) => {
        let id = 'new';
        if (datum) id = datum.nodeID;
        dispatch(setSelectedDatumObject(''));
        setDialogTarget(id);
      },
      [dispatch]
    );

    const dialogTargetObject = datumObjects.find(
      (datum) => datum.nodeID === dialogTarget
    );

    const onDatumDialogApply = (datum: IDatumObject) => {
      if (dialogTargetObject) {
        dialogTargetObject.copy(datum);
      } else {
        datumGroup.children.push(datum);
        setDialogTarget(`new${uuidv4()}`);
      }
      update();
    };

    const onDelete = () => {
      datumGroup.children = datumObjects.filter(
        (datum) => selected !== datum.nodeID
      );
      update();
    };

    let selectedInGroup = false;
    if (datumObjects.find((child) => child.nodeID === selected)) {
      if (!expanded) {
        setExpanded(datumGroup.nodeID);
      }
      selectedInGroup = true;
    }

    return (
      <>
        <Accordion
          expanded={expanded}
          onChange={(e, expanded) => {
            if (expanded) {
              setExpanded(datumGroup.nodeID);
            } else {
              setExpanded('');
            }
            dispatch(setSelectedDatumObject(''));
          }}
          sx={{
            backgroundColor: expanded ? '#d5ffd5' : '#ddd',
            ml: 1,
            mr: 1,
            '&.Mui-expanded': {
              ml: 1,
              mr: 1,
              mt: 0,
              mb: 0
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            sx={{
              userSelect: 'none',
              '&.Mui-focusVisible': {
                backgroundColor: 'unset'
              },
              '.MuiAccordionSummary-content': {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }
            }}
          >
            <EditableTypography
              typography={<Typography>{datumGroup.name}</Typography>}
              initialValue={datumGroup.name}
              validation={Yup.string().required('required')}
              onSubmit={(value) => {
                if (datumGroup.name !== value) {
                  datumGroup.name = value;
                  update();
                }
              }}
              textFieldProps={{
                sx: {
                  flex: '1 1 100%',
                  '& legend': {display: 'none'},
                  '& fieldset': {top: 0}
                },
                InputProps: {
                  sx: {color: '#000'}
                }
              }}
            />
            <Box component="div">
              <Tooltip
                title="Add a new datum object"
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
                      onDatumDblClick(undefined);
                    }}
                    disabled={!expanded}
                  >
                    <AddBoxIcon />
                  </IconButton>
                </span>
              </Tooltip>
              {selectedInGroup ? (
                <Tooltip
                  title="Delete a selected object"
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
                      disabled={!expanded}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : null}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{pt: 0, pb: 1, pl: 1, pr: 1}}>
            <TableContainer
              component={Paper}
              sx={{
                '&::-webkit-scrollbar': {
                  height: '10px'
                },
                '&::-webkit-scrollbar-thumb': {
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
                    onClick={() => dispatch(setSelectedDatumObject(''))}
                  >
                    <TableCell align="left">Visibility</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="left">description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datumObjects?.map((datum) => (
                    <DatumRow
                      key={datum.nodeID}
                      datum={datum}
                      visibility={datum.visibility}
                      onDatumDblClick={onDatumDblClick}
                      update={update}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
        <DatumDialog
          open={dialogTarget !== ''}
          close={() => {
            setDialogTarget('');
            updateState();
          }}
          apply={onDatumDialogApply}
          datum={dialogTargetObject}
          key={dialogTargetObject?.nodeID ?? dialogTarget}
        />
      </>
    );
  }
);

const DatumRow = React.memo(
  (props: {
    datum: IDatumObject;
    visibility: boolean;
    onDatumDblClick: (datum: IDatumObject) => void;
    update: () => void;
  }) => {
    const {datum, visibility, onDatumDblClick, update} = props;
    const dispatch = useDispatch();
    const enabledColorLight: number = useSelector(
      (state: RootState) => state.uigd.enabledColorLight
    );

    const selected = useSelector(
      (state: RootState) => state.uitgd.gdSceneState.selectedDatumObject
    );

    const handleClick = React.useCallback(() => {
      if (datum.nodeID !== selected) {
        dispatch(setSelectedDatumObject(datum.nodeID));
      }
    }, [datum.nodeID, dispatch, selected]);

    return (
      <TableRow
        sx={{
          '&:last-child td, &:last-child th': {border: 0},
          userSelect: 'none',
          backgroundColor:
            selected === datum.nodeID
              ? alpha(numberToRgb(enabledColorLight), 0.5)
              : 'unset'
        }}
        onClick={handleClick}
        onFocus={handleClick}
        onDoubleClick={() => onDatumDblClick(datum)}
      >
        <TableCell align="left">
          <Visibility
            visible={visibility}
            onClick={() => {
              datum.visibility = !datum.visibility;
              update();
            }}
          />
        </TableCell>
        <TableCell sx={{whiteSpace: 'wrap', minWidth: '15vh'}}>
          <EditableTypography
            typography={datum.name}
            initialValue={datum.name}
            validation={Yup.string().required('required')}
            onSubmit={(value) => {
              if (datum.name !== value) {
                datum.name = value;
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
        <TableCell align="left">{datum.description}</TableCell>
      </TableRow>
    );
  }
);
