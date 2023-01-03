/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Group} from 'three';
import {Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {setSelectedMeasureTool} from '@app/store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {Paper, Typography} from '@mui/material';
import {IPosition} from '@gd/measure/IMeasureTools';

export const Position = (props: {tool: IPosition}) => {
  const {tool} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      dispatch(setSelectedMeasureTool(tool.nodeID));
    },
    [tool.nodeID]
  );

  const selected =
    useSelector(
      (state: RootState) => state.uitgd.gdSceneState.selectedMeasureTool
    ) === tool.nodeID;

  const position = tool.point.getThreePoint().applyMatrix3(coMatrix);
  const {x, y, z} = position;
  const groupRef = React.useRef<Group>(null!);
  const spanRefs = [x, y, z].map(() => React.createRef<HTMLSpanElement>());

  useFrame(() => {
    const position = tool.point.getThreePoint().applyMatrix3(coMatrix);
    const {x, y, z} = position;
    groupRef.current.position.copy(position);
    ['x', 'y', 'z'].forEach((v, i) => {
      const ref = spanRefs[i];
      if (!ref.current) return;
      const span = ref.current;
      span.innerText = `${v}:${[x, y, z][i].toFixed(3)}`;
    });
  });

  return (
    <group position={position} ref={groupRef}>
      <Html onDoubleClick={handleOnDoubleClick}>
        <Paper
          elevation={3}
          sx={{
            minWidth: 100,
            userSelect: 'none',
            transform: 'translate3d(20px, -50%, 0)',
            paddingTop: 0.7,
            paddingBottom: 0.7,
            paddingLeft: 1,
            paddingRight: 1,
            border: selected ? '2px solid #ffa500' : undefined,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '-10px',
              height: '1px',
              width: '40px',
              background: 'white'
            }
          }}
        >
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              padding: 0,
              margin: 0,
              whiteSpace: 'nowrap'
            }}
          >
            &nbsp;{tool.name}
          </Typography>
          {['x', 'y', 'z'].map((v, i) => (
            <Typography
              variant="caption"
              display="block"
              gutterBottom
              key={v}
              ref={spanRefs[i]}
              sx={{
                padding: 0,
                pl: 1,
                margin: 0,
                whiteSpace: 'nowrap'
              }}
            >
              {`${v}:${[x, y, z][i].toFixed(3)}`}
            </Typography>
          ))}
        </Paper>
      </Html>
    </group>
  );
};
