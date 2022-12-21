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
import {useSelector} from 'react-redux';
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
import {DatumGroupName} from './DatumGroupName';
import {DatumDialog} from './DatumDialog';

export function DatumGroupTable(props: {
  datumGroup: IDatumGroup;
  expanded: string;
  setExpanded: React.Dispatch<React.SetStateAction<string>>;
  update: () => void;
}) {
  const {datumGroup, expanded, setExpanded, update} = props;
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );
  const [selected, setSelected] = React.useState<string>('');
  const [dialogTarget, setDialogTarget] = React.useState<string>('');
  const datumObjects = datumGroup.children;

  const onDatumDblClick = (datum: IDatumObject | undefined) => {
    let id = 'new';
    if (datum) id = datum.nodeID;
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
      setDialogTarget(datum.nodeID);
    }
    update();
  };

  return (
    <>
      <Accordion
        TransitionProps={{unmountOnExit: true}}
        expanded={datumGroup.nodeID === expanded}
        onChange={(e, expanded) => {
          if (expanded) setExpanded(datumGroup.nodeID);
          else setExpanded('');
        }}
        sx={{
          backgroundColor: datumGroup.nodeID === expanded ? '#f5fff5' : '#ddd',
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
                  zIndex: 12500000000
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
                <TableRow onClick={() => setSelected('')}>
                  <TableCell>Order</TableCell>
                  <TableCell>Visible</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Type</TableCell>
                  <TableCell align="right">description</TableCell>
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
                      onClick={() => setSelected(datum.nodeID)}
                      onDoubleClick={() => onDatumDblClick(datum)}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell align="right">{datum.visibility}</TableCell>
                      <TableCell sx={{whiteSpace: 'nowrap'}}>
                        {datum.name}
                      </TableCell>
                      <TableCell align="right">{datum.className}</TableCell>
                      <TableCell align="right">{datum.description}</TableCell>
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
        }}
        apply={onDatumDialogApply}
        datum={dialogTargetObject}
        key={dialogTargetObject?.nodeID}
      />
    </>
  );
}
