import * as React from 'react';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Group} from 'three';
import {Line, Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {setSelectedMeasureTool} from '@app/store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {Paper, Typography} from '@mui/material';
import {IDistance} from '@gd/measure/measureTools/IMeasureTools';
import {Line2} from 'three-stdlib';

export const Distance = (props: {tool: IDistance}) => {
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
    [dispatch, tool.nodeID]
  );

  const selected =
    useSelector(
      (state: RootState) => state.uitgd.gdSceneState.selectedMeasureTool
    ) === tool.nodeID;

  const distance = tool.value._;
  const points = tool.getClosestPoints().map((p) => p.applyMatrix3(coMatrix));
  const position = points[0].clone().add(points[1]).multiplyScalar(0.5);

  const meshRef = React.useRef<Line2>(null!);
  const groupRef = React.useRef<Group>(null!);
  const spanRefs = [position].map(() => React.createRef<HTMLSpanElement>());

  useFrame(() => {
    const distance = tool.value._;
    const points = tool.getClosestPoints().map((p) => p.applyMatrix3(coMatrix));
    const position = points[0].clone().add(points[1]).multiplyScalar(0.5);

    let color: string | number = 'Crimson';
    if (selected) {
      color = 0xffa500;
    }
    meshRef.current.material.color.set(color);

    const begin = points[0];
    const end = points[1];

    const start = meshRef.current.geometry.attributes.instanceStart
      .array as Float32Array;
    start[0] = begin.x;
    start[1] = begin.y;
    start[2] = begin.z;
    start[3] = end.x;
    start[4] = end.y;
    start[5] = end.z;
    meshRef.current.geometry.attributes.instanceStart.needsUpdate = true;

    groupRef.current.position.copy(position);
    ['distance'].forEach((v, i) => {
      const ref = spanRefs[i];
      if (!ref.current) return;
      const span = ref.current;
      span.innerText = `${v}:${[distance][i].toFixed(3)}`;
    });
  });

  return (
    <>
      <Line
        points={points}
        lineWidth={4}
        ref={meshRef}
        onDoubleClick={(e) => handleOnDoubleClick(e)}
      />
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
              backgroundColor: selected ? '#ffa500' : undefined,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '-10px',
                height: '1px',
                width: '40px',
                background: selected ? '#ffa500' : 'white'
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
            {['distance'].map((v, i) => (
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
                {`${v}:${[distance][i].toFixed(3)}`}
              </Typography>
            ))}
          </Paper>
        </Html>
      </group>
    </>
  );
};
