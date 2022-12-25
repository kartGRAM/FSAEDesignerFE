/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IPoint} from '@gd/measure/IDatumObjects';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Sphere, Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectSidePanelTab,
  setSelectedDatumObject,
  setDatumPointSelected
} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {Paper, Typography} from '@mui/material';

export default function Point(params: {point: IPoint}) {
  const {point} = params;

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  const position = point.getThreePoint().applyMatrix3(coMatrix);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = React.useRef<THREE.Mesh>(null);

  const dispatch = useDispatch();

  const handleOnDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!meshRef.current?.visible) return;
    e.stopPropagation();
    const state = store.getState().uitgd;
    if (state.gdSceneState.datumPointSelectMode) {
      dispatch(setDatumPointSelected(point.nodeID));
      return;
    }
    if (state.uiDisabled) return;
    dispatch(selectSidePanelTab({tab: 'measure'}));
    dispatch(setSelectedDatumObject(point.nodeID));
  };

  const [show, setShow] = React.useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    const state = store.getState().uitgd.gdSceneState;
    let isSelected = false;
    if (state.datumPointSelectMode) {
      isSelected = state.datumPointSelected === point.nodeID;
    } else {
      isSelected = state.selectedDatumObject === point.nodeID;
    }
    let color = 0x00ff00;
    if (isSelected) {
      color = 0xff0000;
      meshRef.current.scale.set(1.1, 1.1, 1.1);
    } else {
      meshRef.current.scale.set(1.0, 1.0, 1.0);
    }
    if (materialRef.current) {
      materialRef.current.color.set(color);
    }
    meshRef.current.visible =
      state.forceVisibledDatums.includes(point.nodeID) ||
      state.datumPointSelectMode ||
      point.visibility;
    // console.log(point.getThreePoint());
    meshRef.current.position.copy(point.getThreePoint().applyMatrix3(coMatrix));
  });

  return (
    <Sphere
      position={position}
      ref={meshRef}
      args={[5, 16, 16]}
      onDoubleClick={(e) => {
        handleOnDoubleClick(e);
      }}
      onPointerEnter={() => {
        if (meshRef.current?.visible) setShow(true);
      }}
      onPointerLeave={() => setShow(false)} // see note 1
    >
      <meshBasicMaterial color={0x00ff00} ref={materialRef} />
      {show ? (
        <Html>
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
              &nbsp;{point.name}
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
              {point.description}
            </Typography>
          </Paper>
        </Html>
      ) : null}
    </Sphere>
  );
}
