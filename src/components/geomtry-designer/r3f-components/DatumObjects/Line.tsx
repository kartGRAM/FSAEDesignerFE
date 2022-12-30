/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {ILine} from '@gd/measure/IDatumObjects';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line as DLine, Html, Sphere} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectSidePanelTab,
  setSelectedDatumObject,
  setDatumLineSelected
} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {Paper, Typography} from '@mui/material';
import {Line2} from 'three-stdlib';

export default function Line(params: {line: ILine}) {
  const {line} = params;

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  const meshRef = React.useRef<Line2>(null);
  const sphereMeshRef = React.useRef<THREE.Mesh>(null);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null!);

  const dispatch = useDispatch();

  const handleOnDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!meshRef.current?.visible) return;
    e.stopPropagation();
    const state = store.getState().uitgd;
    if (state.gdSceneState.datumLineSelectMode) {
      dispatch(setDatumLineSelected(line.nodeID));
      return;
    }
    if (state.uiDisabled) return;
    dispatch(selectSidePanelTab({tab: 'measure'}));
    dispatch(setSelectedDatumObject(line.nodeID));
  };

  const [show, setShow] = React.useState(false);

  useFrame(() => {
    if (!meshRef.current || !sphereMeshRef.current) return;
    const state = store.getState().uitgd.gdSceneState;
    let isSelected = false;
    if (state.datumLineSelectMode) {
      isSelected = state.datumLineSelected === line.nodeID;
    } else {
      isSelected = state.selectedDatumObject === line.nodeID;
    }
    let color = 0x00ff00;
    if (isSelected) {
      color = 0xff0000;
    }
    meshRef.current.material.color.set(color);
    materialRef.current.color.set(color);

    const begin = line.lineStart.applyMatrix3(coMatrix);
    const end = line.lineEnd.applyMatrix3(coMatrix);
    sphereMeshRef.current.position.copy(begin);

    const start = meshRef.current.geometry.attributes.instanceStart
      .array as Float32Array;
    start[0] = begin.x;
    start[1] = begin.y;
    start[2] = begin.z;
    start[3] = end.x;
    start[4] = end.y;
    start[5] = end.z;
    meshRef.current.geometry.attributes.instanceStart.needsUpdate = true;

    meshRef.current.visible =
      state.forceVisibledDatums.includes(line.nodeID) ||
      state.datumLineSelectMode ||
      line.visibility;
    sphereMeshRef.current.visible = meshRef.current.visible;
  });

  const points = [line.lineStart, line.lineEnd].map((p) =>
    p.applyMatrix3(coMatrix)
  );
  const position = points[0].clone().add(points[1]).multiplyScalar(0.5);

  return (
    <>
      <Sphere
        args={[3, 8, 8]}
        position={points[0]}
        ref={sphereMeshRef}
        onDoubleClick={(e) => {
          handleOnDoubleClick(e);
        }}
        onPointerEnter={() => {
          if (meshRef.current?.visible) setShow(true);
        }}
        onPointerLeave={() => setShow(false)} // see note 1
      >
        <meshBasicMaterial color={0x00ff00} ref={materialRef} />
      </Sphere>
      <DLine
        points={points}
        lineWidth={4}
        ref={meshRef}
        onDoubleClick={(e) => {
          handleOnDoubleClick(e);
        }}
        onPointerEnter={() => {
          if (meshRef.current?.visible) setShow(true);
        }}
        onPointerLeave={() => setShow(false)} // see note 1
      >
        {show ? (
          <Html position={position}>
            <Paper
              elevation={3}
              sx={{
                userSelect: 'none',
                transform: 'translate3d(20px, -50%, 0)',
                paddingTop: 0.7,
                paddingBottom: 0.7,
                paddingLeft: 1,
                paddingRight: 1,
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
                &nbsp;{line.name}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                gutterBottom
                sx={{
                  padding: 0,
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                {line.description}
              </Typography>
            </Paper>
          </Html>
        ) : null}
      </DLine>
    </>
  );
}
