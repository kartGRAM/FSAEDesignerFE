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
import {setSelectedDatumObject} from '@store/reducers/uiTempGeometryDesigner';
import {setChanged} from '@store/reducers/dataGeometryDesigner';
import {RootState} from '@store/store';
import {alpha} from '@mui/material/styles';
import {IDatumGroup, IDatumObject} from '@gd/measure/IDatumObjects';
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
import {DatumGroupName} from './DatumGroupName';
import {DatumDialog} from './DatumDialog';

export function DatumGroupTable(props: {
  datumGroup: IDatumGroup;
  expanded: string;
  setExpanded: React.Dispatch<React.SetStateAction<string>>;
  update: () => void;
}) {
  const {datumGroup, setExpanded, update} = props;
  let {expanded} = props;
  const dispatch = useDispatch();
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const selected = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.selectedDatumObject
  );

  const [dialogTarget, setDialogTarget] = React.useState<string>('');
  const datumObjects = datumGroup.children;

  const tooltipZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.tooltipZIndex
  );

  const onDatumDblClick = (datum: IDatumObject | undefined) => {
    let id = 'new';
    if (datum) id = datum.nodeID;
    dispatch(setSelectedDatumObject(''));
    setDialogTarget(id);
  };

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
    if (datumGroup.nodeID !== expanded) {
      setExpanded(datumGroup.nodeID);
      expanded = datumGroup.nodeID;
    }
    selectedInGroup = true;
  }

  return (
    <>
      <Accordion
        TransitionProps={{unmountOnExit: true}}
        expanded={datumGroup.nodeID === expanded}
        onChange={(e, expanded) => {
          if (expanded) {
            dispatch(setSelectedDatumObject(''));
            setExpanded(datumGroup.nodeID);
          } else {
            dispatch(setSelectedDatumObject(''));
            setExpanded('');
          }
        }}
        sx={{
          backgroundColor: datumGroup.nodeID === expanded ? '#d5ffd5' : '#ddd',
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
            }
          }}
        >
          <DatumGroupName group={datumGroup} />
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
                disabled={datumGroup.nodeID !== expanded}
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
                  disabled={datumGroup.nodeID !== expanded}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
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
                <TableRow onClick={() => dispatch(setSelectedDatumObject(''))}>
                  <TableCell>Order</TableCell>
                  <TableCell align="left">Visibility</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="left">description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datumObjects?.map((datum, idx) => {
                  return (
                    <TableRow
                      key={datum.nodeID}
                      sx={{
                        '&:last-child td, &:last-child th': {border: 0},
                        userSelect: 'none',
                        backgroundColor:
                          selected === datum.nodeID
                            ? alpha(numberToRgb(enabledColorLight), 0.5)
                            : 'unset'
                      }}
                      onClick={() => {
                        if (datum.nodeID !== selected) {
                          dispatch(setSelectedDatumObject(datum.nodeID));
                        }
                      }}
                      onDoubleClick={() => onDatumDblClick(datum)}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell align="left">
                        <Visibility
                          visible={datum.visibility}
                          onClick={() => {
                            datum.visibility = !datum.visibility;
                            update();
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{whiteSpace: 'nowrap'}}>
                        {datum.name}
                      </TableCell>
                      <TableCell align="left">{datum.description}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
      <DatumDialog
        open={dialogTarget !== ''}
        close={() => {
          setDialogTarget('');
          update();
        }}
        apply={onDatumDialogApply}
        datum={dialogTargetObject}
        key={dialogTargetObject?.nodeID ?? dialogTarget}
      />
    </>
  );
}
