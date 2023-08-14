/* eslint-disable no-nested-ternary */

import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useDispatch, useSelector} from 'react-redux';
import store, {RootState} from '@store/store';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Toolbar from '@mui/material/Toolbar';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {datumObjectAccordionDefaultExpandedChange} from '@store/reducers/uiGeometryDesigner';
import {DatumGroup} from '@gd/measure/datum/DatumManager';
import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';
import {setDatumObjects} from '@store/reducers/dataGeometryDesigner';
import {setSelectedDatumObject} from '@app/store/reducers/uiTempGeometryDesigner';
import {DatumGroupTable} from './DatumGroup';

export default function DatumManager() {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = React.useState<string>('');
  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );
  const datumGroups = datumManager?.children ?? [];
  const datumObjectsAccExpanded =
    store.getState().uigd.present.measurePanelState.DatumObjectsExpanded;

  const dialogZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.dialogZIndex
  );
  const tooltipZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.tooltipZIndex
  );

  const addNewDatumGroup = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    if (datumManager) {
      const group = new DatumGroup({
        name: `new group${datumGroups.length + 1}`
      });
      datumManager.addGroup(group);
      datumManager.dispatch();
    }
  };

  const update = () => {
    if (!datumManager) return;
    dispatch(setDatumObjects(datumManager.getData()));
  };

  const removeDatumGroup = async (nodeID: string) => {
    if (datumManager) {
      const ret = await new Promise<string>((resolve) => {
        dispatch(
          setConfirmDialogProps({
            zindex: dialogZIndex,
            onClose: resolve,
            buttons: [
              {text: 'OK', res: 'ok'},
              {text: 'Cancel', res: 'cancel', autoFocus: true}
            ],
            title: 'Confirm',
            message: 'All datums within the group will be removed. Are you OK?'
          })
        );
      });
      dispatch(setConfirmDialogProps(undefined));
      if (ret === 'ok') {
        datumManager.removeGroup(nodeID);
        datumManager.dispatch();
      }
    }
  };

  React.useEffect(() => {
    return () => {
      dispatch(setSelectedDatumObject(''));
    };
  }, []);

  return (
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
      defaultExpanded={datumObjectsAccExpanded}
      onChange={(e, expanded) => {
        dispatch(datumObjectAccordionDefaultExpandedChange(expanded));
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
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
            Datum Groups & Datum Objects
          </Typography>
          {datumObjectsAccExpanded ? (
            expanded !== '' ? (
              <Tooltip
                title="Delete"
                sx={{flex: '1'}}
                componentsProps={{
                  popper: {
                    sx: {
                      zIndex: tooltipZIndex
                    }
                  }
                }}
              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDatumGroup(expanded);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            ) : datumGroups.length !== 0 ? (
              <Tooltip
                title="Add a new group"
                sx={{flex: '1'}}
                componentsProps={{
                  popper: {
                    sx: {
                      zIndex: tooltipZIndex
                    }
                  }
                }}
              >
                <IconButton onClick={addNewDatumGroup}>
                  <AddBoxIcon />
                </IconButton>
              </Tooltip>
            ) : null
          ) : null}
        </Toolbar>
      </AccordionSummary>
      <AccordionDetails sx={{padding: 0, pb: 3}}>
        {datumGroups.length === 0 ? (
          <Box
            component="div"
            display="flex"
            alignItems="center"
            justifyContent="center"
            padding={3}
          >
            <Button variant="contained" size="large" onClick={addNewDatumGroup}>
              Create A New Datum Group
            </Button>
          </Box>
        ) : (
          datumGroups.map((group) => (
            <DatumGroupTable
              datumGroup={group}
              key={group.nodeID}
              expanded={expanded}
              setExpanded={setExpanded}
              update={update}
            />
          ))
        )}
      </AccordionDetails>
    </Accordion>
  );
}
