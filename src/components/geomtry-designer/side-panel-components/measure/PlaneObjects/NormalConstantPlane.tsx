import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {INormalConstantPlane} from '@gd/measure/IPlaneObjects';
import {NormalConstantPlane as NormalConstantPlaneObject} from '@gd/measure/PlaneObjects';
import {IDatumObject, isLine} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Scalar from '@gdComponents/Scalar';
import {RootState} from '@store/store';
import {NamedNumber, NamedVector3} from '@gd/NamedValues';
import {isNamedVector3} from '@gd/INamedValues';
import {
  setDatumLineSelectMode,
  setDatumLineSelected
} from '@store/reducers/uiTempGeometryDesigner';
import Target from '@gdComponents/svgs/Target';
import Vector from '@gdComponents/Vector';

export const normalTypes = ['datum line', 'constant vector'] as const;
export type NormalType = typeof normalTypes[number];

export function NormalConstantPlane(props: {
  plane?: INormalConstantPlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {plane, setApplyReady} = props;
  const dispatch = useDispatch();

  const ids = [React.useId(), React.useId()];

  const [distance, setDistance] = React.useState(
    new NamedNumber({
      name: 'normal',
      value: plane?.distance.getStringValue() ?? 0
    })
  );

  const [normalType, setNormalType] = React.useState<NormalType>(
    isNamedVector3(plane?.normal) ? 'constant vector' : 'datum line'
  );

  const selectMode = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelectMode
  );

  const selectedLine = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelected
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === plane?.nodeID);

  const lineObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isLine(datum));

  const defaultLine =
    (!isNamedVector3(plane?.normal) ? plane?.normal : undefined) ?? '';

  const [line, setLine] = React.useState(defaultLine);
  const [normal, setNormal] = React.useState(
    new NamedVector3({
      name: 'normal',
      value: isNamedVector3(plane?.normal)
        ? plane?.normal.getStringValue()
        : undefined
    })
  );

  const onResetSetterMode = () => {
    dispatch(setDatumLineSelected(''));
    dispatch(setDatumLineSelectMode(false));
  };

  React.useEffect(() => {
    if (
      lineObjects.find((datum) => datum.nodeID === selectedLine) &&
      selectedLine !== line
    ) {
      setLine(selectedLine);
    }
    onResetSetterMode();
  }, [selectedLine]);

  React.useEffect(() => {
    if (normalType === 'constant vector') {
      const obj: INormalConstantPlane = new NormalConstantPlaneObject({
        name: `datum plane`,
        distance: distance.getStringValue(),
        normal
      });
      setApplyReady(obj);
    } else if (normalType === 'datum line' && line !== '') {
      const obj: INormalConstantPlane = new NormalConstantPlaneObject({
        name: `datum plane`,
        distance: distance.getStringValue(),
        normal: line
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
  }, [normal, distance, normalType, line]);

  const shortCutKeys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onResetSetterMode();
    }
  };

  React.useEffect(() => {
    dispatch(setDatumLineSelectMode(false));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setDatumLineSelectMode(false));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, []);

  return (
    <Box component="div">
      <FormControl
        sx={{
          m: 1,
          mt: 3,
          minWidth: 250,
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        <InputLabel htmlFor={ids[0]}>Select normal type</InputLabel>
        <Select
          disabled={selectMode}
          value={normalType}
          id={ids[0]}
          label="Select normal type"
          onChange={(e) => setNormalType(e.target.value as NormalType)}
          sx={{flexGrow: '1'}}
          MenuProps={{
            sx: {zIndex: 150000000000}
          }}
        >
          <MenuItem aria-label="None" value="">
            <em>None</em>
          </MenuItem>
          {normalTypes.map((type) => (
            <MenuItem value={type} key={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {normalType === 'datum line' ? (
        <FormControl
          sx={{
            m: 1,
            mt: 3,
            minWidth: 250,
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <InputLabel htmlFor={ids[1]}>Select a line</InputLabel>
          <Select
            disabled={selectMode}
            value={line}
            id={ids[1]}
            label="Select a line"
            onChange={(e) => setLine(e.target.value)}
            sx={{flexGrow: '1'}}
            MenuProps={{
              sx: {zIndex: 150000000000}
            }}
          >
            <MenuItem aria-label="None" value="">
              <em>None</em>
            </MenuItem>
            {lineObjects.map((datum) => (
              <MenuItem value={datum.nodeID} key={datum.nodeID}>
                {datum.name}
              </MenuItem>
            ))}
          </Select>
          <Target
            sx={{mt: 1}}
            title="Select a line"
            onClick={() => dispatch(setDatumLineSelectMode(true))}
            disabled={selectMode}
          />
        </FormControl>
      ) : (
        <Vector
          vector={normal}
          unit="mm"
          onUpdate={() => {
            setNormal(
              new NamedVector3({
                name: 'normal',
                value: normal.getStringValue()
              })
            );
          }}
        />
      )}
      <Scalar
        value={distance}
        unit="mm"
        onUpdate={() => {
          setDistance(
            new NamedNumber({
              name: 'distance',
              value: distance.getStringValue()
            })
          );
        }}
      />
    </Box>
  );
}
