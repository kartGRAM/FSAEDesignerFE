import React from 'react';
import {hasNearestNeighborToPlane} from '@gd/SpecialPoints';
import store, {RootState} from '@store/store';
import {useSelector} from 'react-redux';
import {PointToPlaneControl} from '@gd/controls/PointToPlaneControl';
import {IDataControl} from '@gd/controls/IControls';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {InputBaseComponentProps} from '@mui/material/InputBase';
import {isNumber, numberToRgb} from '@app/utils/helpers';
import useUpdateEffect from '@app/hooks/useUpdateEffect';
import {IElement, isSimplifiedElement} from '@gd/IElements';
import {isAArm} from '@gd/IElements/IAArm';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Select from '@mui/material/Select';
import Vector from '@gdComponents/Vector';
import Scalar from '@gdComponents/Scalar';
import {NamedVector3, NamedNumber} from '@gd/NamedValues';
import {INamedVector3RO} from '@gd/INamedValues';
import {
  IconButton,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Table from '@mui/material/Table';
import {alpha} from '@mui/material/styles';

export interface PointToPlaneControlProps {
  control: PointToPlaneControl;
  setStaged: React.Dispatch<React.SetStateAction<null | IDataControl | string>>;
}

export function PointToPlaneControlSettings(props: PointToPlaneControlProps) {
  const {control, setStaged} = props;
  const [speed, setSpeed] = React.useState<number | ''>(control.speed);
  const [reverse, setReverse] = React.useState<boolean>(control.reverse);
  const speedMax = 400;
  const speedMin = 0;

  const [selectedIDs, setSelectedIDs] = React.useState<
    {element: string; point: string}[]
  >(
    control.targetElements.reduce((prev, current) => {
      const points = control.pointIDs[current].map((p) => ({
        element: current,
        point: p
      }));
      return [...prev, ...points];
    }, [] as {element: string; point: string}[])
  );
  const selectedElementIDs = selectedIDs.map((r) => r.element);
  const [selectedRow, setSelectedRow] = React.useState<string>('none');

  const [normal, setNormal] = React.useState(
    new NamedVector3({value: control.normal})
  );
  const [origin, setOrigin] = React.useState(
    new NamedVector3({value: control.origin})
  );

  const [min, setMin] = React.useState(new NamedNumber({value: control.min}));

  const [max, setMax] = React.useState(new NamedNumber({value: control.max}));

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex + uitgd.menuZIndex;

  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const state = store.getState();
  const elements = state.uitgd.collectedAssembly?.children ?? [];
  const elementsByClass = elements.reduce((prev, current) => {
    if (isSimplifiedElement(current) || isAArm(current)) return prev;
    if (!(current.className in prev)) prev[current.className] = [];
    prev[current.className].push(current);
    return prev;
  }, {} as {[index: string]: IElement[]});
  const selectedElements = elements.filter((element) =>
    selectedElementIDs.includes(element.nodeID)
  );

  const points = selectedElements.reduce((prev, current) => {
    prev[current.nodeID] = current.getMeasurablePoints();
    return prev;
  }, {} as {[index: string]: INamedVector3RO[]});

  const handleSliderSpeedChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    if (!isNumber(newValue)) newValue = newValue.shift() ?? 0;
    setSpeed(newValue);
  };
  const handleInputSpeedChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSpeed(event.target.value === '' ? '' : Number(event.target.value));
  };

  const handleBlur = () => {
    if (isNumber(speed) && speed < speedMin) setSpeed(speedMin);
  };

  const handleReverseChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setReverse(checked);
  };

  useUpdateEffect(() => {
    const elementIDs = elements.map((e) => e.nodeID);
    const groupedIDs = selectedIDs.reduce((prev, current) => {
      if (elementIDs.includes(current.element)) {
        if (current.point !== '') {
          if (!prev[current.element]) prev[current.element] = [];
          if (!prev[current.element].includes(current.point)) {
            prev[current.element].push(current.point);
          }
        }
      }
      return prev;
    }, {} as {[index: string]: string[]});
    control.targetElements = Object.keys(groupedIDs);
    control.pointIDs = groupedIDs;
    control.speed = isNumber(speed) ? speed : 0;
    control.reverse = reverse;
    control.normal.setValue(normal);
    control.origin.setValue(origin);
    control.min.setValue(min.getStringValue());
    control.max.setValue(max.getStringValue());
    setStaged(control.getDataControl());
  }, [selectedIDs, speed, reverse, normal, origin, min, max]);

  return (
    <>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          mt: 0.7,
          ml: 2
        }}
      >
        {selectedIDs.length < 2 ? (
          <>
            <FormControl sx={{minWidth: 320}}>
              <InputLabel htmlFor="component-select">
                Select a component
              </InputLabel>
              <Select
                value={selectedIDs[0]?.element ?? ''}
                label="Select a component"
                MenuProps={{
                  sx: {zIndex: zindex}
                }}
                onChange={(e) => {
                  setSelectedIDs([{element: e.target.value, point: ''}]);
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {Object.keys(elementsByClass)
                  .map((key) => [
                    <ListSubheader key={key}>{key}</ListSubheader>,
                    ...elementsByClass[key].map((element) => (
                      <MenuItem value={element.nodeID} key={element.nodeID}>
                        {element.name.value}
                      </MenuItem>
                    ))
                  ])
                  .flat()}
              </Select>
            </FormControl>
            <FormControl sx={{ml: 3, minWidth: 320}}>
              <InputLabel htmlFor="component-select">Select a node</InputLabel>
              <Select
                value={selectedIDs[0]?.point ?? ''}
                label="Select a node"
                MenuProps={{
                  sx: {zIndex: zindex}
                }}
                onChange={(e) => {
                  setSelectedIDs((prev) => {
                    prev[0].point = e.target.value;
                    return [...prev];
                  });
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {(points[selectedIDs[0]?.element ?? ''] ?? []).map((p) => (
                  <MenuItem value={p.nodeID} key={p.nodeID}>
                    {p.name}
                  </MenuItem>
                ))}
                {hasNearestNeighborToPlane(selectedElements[0]) ? (
                  <MenuItem value="nearestNeighbor" key="nearestNeighbor">
                    nearest neighbor
                  </MenuItem>
                ) : null}
              </Select>
            </FormControl>
            <Box
              component="div"
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                ml: 1
              }}
            >
              <IconButton
                aria-label="add"
                onClick={() => {
                  setSelectedIDs((prev) => {
                    return [...prev, {element: '', point: ''}];
                  });
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box
            component="div"
            sx={{display: 'flex', flexDirection: 'column', width: '100%', m: 0}}
          >
            <Box component="div" sx={{display: 'flex', flexDirection: 'row'}}>
              <IconButton
                aria-label="add"
                onClick={() => {
                  setSelectedIDs((prev) => {
                    return [...prev, {element: '', point: ''}];
                  });
                }}
              >
                <AddIcon />
              </IconButton>
              <IconButton
                aria-label="delete"
                onClick={() => {
                  setSelectedIDs((prev) => {
                    return prev.filter(
                      (row, idx) =>
                        row.element + row.point + idx.toString() !== selectedRow
                    );
                  });
                  setSelectedRow('none');
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
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
                  <TableRow onClick={() => setSelectedRow('none')}>
                    <TableCell>Order</TableCell>
                    <TableCell align="left">Component Name</TableCell>
                    <TableCell align="left">Point Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedIDs.map((row, idx) => {
                    const id = row.element + row.point + idx.toString();
                    return (
                      <TableRow
                        key={id}
                        sx={{
                          '&:last-child td, &:last-child th': {border: 0},
                          userSelect: 'none',
                          backgroundColor:
                            selectedRow === id
                              ? alpha(numberToRgb(enabledColorLight), 0.5)
                              : 'unset'
                        }}
                        onClick={() => {
                          if (id !== selectedRow) {
                            setSelectedRow(id);
                          }
                        }}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell align="left">
                          <Select
                            displayEmpty
                            value={selectedIDs[idx]?.element ?? ''}
                            sx={{
                              ml: 0,
                              '& legend': {display: 'none'},
                              '& fieldset': {top: 0},
                              width: '100%'
                            }}
                            MenuProps={{
                              sx: {zIndex: zindex}
                            }}
                            onChange={(e) => {
                              setSelectedIDs((prev) => {
                                prev[idx].element = e.target.value;
                                prev[idx].point = '';
                                return [...prev];
                              });
                            }}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {Object.keys(elementsByClass)
                              .map((key) => [
                                <ListSubheader key={key}>{key}</ListSubheader>,
                                ...elementsByClass[key].map((element) => (
                                  <MenuItem
                                    value={element.nodeID}
                                    key={element.nodeID}
                                  >
                                    {element.name.value}
                                  </MenuItem>
                                ))
                              ])
                              .flat()}
                          </Select>
                        </TableCell>
                        <TableCell align="left">
                          <Select
                            displayEmpty
                            value={selectedIDs[idx]?.point ?? ''}
                            sx={{
                              ml: 0,
                              '& legend': {display: 'none'},
                              '& fieldset': {top: 0},
                              width: '100%'
                            }}
                            MenuProps={{
                              sx: {zIndex: zindex}
                            }}
                            onChange={(e) => {
                              setSelectedIDs((prev) => {
                                prev[idx].point = e.target.value;
                                return [...prev];
                              });
                            }}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {(points[selectedIDs[idx].element ?? ''] ?? []).map(
                              (p) => (
                                <MenuItem value={p.nodeID} key={p.nodeID}>
                                  {p.name}
                                </MenuItem>
                              )
                            )}
                            {hasNearestNeighborToPlane(selectedElements[0]) ? (
                              <MenuItem
                                value="nearestNeighbor"
                                key="nearestNeighbor"
                              >
                                nearest neighbor
                              </MenuItem>
                            ) : null}
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
      <Vector
        vector={origin}
        onUpdate={() => {
          setOrigin(
            new NamedVector3({
              name: 'origin',
              value: origin.getStringValue()
            })
          );
        }}
        disableSceneButton
        disablePointOffsetTool
      />
      <Vector
        vector={normal}
        onUpdate={() => {
          setNormal(
            new NamedVector3({
              name: 'normal',
              value: normal.getStringValue()
            })
          );
        }}
        disableSceneButton
        disablePointOffsetTool
      />
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
      >
        <Scalar
          value={min}
          onUpdate={() => {
            setMin(
              new NamedNumber({
                name: 'min',
                value: min.getStringValue()
              })
            );
          }}
          unit="mm"
        />
        <Scalar
          value={max}
          onUpdate={() => {
            setMax(
              new NamedNumber({
                name: 'max',
                value: max.getStringValue()
              })
            );
          }}
          unit="mm"
        />
      </Box>
      <Box component="div" sx={{flexGrow: 1, mt: 4, ml: 2}}>
        <ValueField
          value={speed}
          onChange={handleInputSpeedChange}
          onBlur={handleBlur}
          label="Speed"
          name="speed"
          variant="outlined"
          unit="mm/s"
          inputProps={{min, max, step: 1}}
        />
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%', mt: 3}}
      >
        <Box component="div" sx={{flexGrow: 1, mt: 0.7}}>
          <Slider
            size="small"
            aria-label="Small"
            valueLabelDisplay="auto"
            value={isNumber(speed) ? speed : 0}
            min={speedMin}
            max={speedMax}
            onChange={handleSliderSpeedChange}
          />
        </Box>
        <ValueField
          value={speed}
          onChange={handleInputSpeedChange}
          onBlur={handleBlur}
          label="Speed"
          name="speed"
          variant="outlined"
          unit="mm/s"
          inputProps={{min, max, step: 1}}
        />
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
      >
        <FormControlLabel
          control={
            <Checkbox checked={reverse} onChange={handleReverseChange} />
          }
          label="Reverse Direction"
        />
      </Box>
    </>
  );
}

// eslint-disable-next-line no-redeclare
interface MyOutlinedTextFieldProps extends OutlinedTextFieldProps {
  unit: string;
  inputProps?: InputBaseComponentProps;
}

const ValueField = React.memo((props: MyOutlinedTextFieldProps) => {
  const {unit, inputProps} = props;
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
        type: 'number',
        'aria-labelledby': 'input-slider',
        inputProps
      }}
      sx={{
        marginLeft: 3
        // width: '15ch'
      }}
    />
  );
});
