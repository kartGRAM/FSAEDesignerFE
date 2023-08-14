import React from 'react';
import {IPlane} from '@gd/measure/datum/IDatumObjects';
import * as THREE from 'three';
import {Quaternion, Vector3} from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Plane as DPlane, Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectSidePanelTab,
  setSelectedDatumObject,
  setDatumPlaneSelected
} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {Paper, Typography} from '@mui/material';

export default function Plane(params: {plane: IPlane}) {
  const {plane} = params;

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  const plane3 = plane.getThreePlane();
  plane3.normal.applyMatrix3(coMatrix);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = React.useRef<THREE.Mesh>(null);
  const groupRef = React.useRef<THREE.Group>(null!);

  const dispatch = useDispatch();

  const handleOnDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!meshRef.current?.visible) return;
    e.stopPropagation();
    const state = store.getState().uitgd;
    if (state.gdSceneState.datumPlaneSelectMode) {
      dispatch(setDatumPlaneSelected(plane.nodeID));
      return;
    }
    if (state.uiDisabled) return;
    dispatch(selectSidePanelTab({tab: 'measure'}));
    dispatch(setSelectedDatumObject(plane.nodeID));
  };

  const [show, setShow] = React.useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    try {
      const state = store.getState().uitgd.gdSceneState;
      let isSelected = false;
      if (state.datumPointSelectMode) {
        isSelected = state.datumPointSelected === plane.nodeID;
      } else {
        isSelected = state.selectedDatumObject === plane.nodeID;
      }
      let color = 0x00ff00;
      if (isSelected) {
        color = 0xff0000;
      }
      if (materialRef.current) {
        materialRef.current.color.set(color);
      }

      const plane3 = plane.getThreePlane();
      plane3.normal.applyMatrix3(coMatrix);
      const rot = new Quaternion().setFromUnitVectors(
        new Vector3(0, 0, 1),
        plane3.normal
      );

      groupRef.current.position.copy(plane.planeCenter.applyMatrix3(coMatrix));
      groupRef.current.quaternion.copy(rot);

      meshRef.current.visible =
        state.forceVisibledDatums.includes(plane.nodeID) ||
        state.datumPlaneSelectMode ||
        plane.visibility;
      // eslint-disable-next-line no-empty
    } catch {}
  });

  return (
    <group ref={groupRef}>
      <DPlane
        args={[300, 300, 1, 1]}
        ref={meshRef}
        onDoubleClick={(e) => {
          handleOnDoubleClick(e);
        }}
        onPointerEnter={() => {
          if (meshRef.current?.visible) setShow(true);
        }}
        onPointerLeave={() => setShow(false)} // see note 1
      >
        <meshBasicMaterial
          color={0x00ff00}
          ref={materialRef}
          wireframe
          side={THREE.DoubleSide}
        />
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
                &nbsp;{plane.name}
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
                {plane.description}
              </Typography>
            </Paper>
          </Html>
        ) : null}
      </DPlane>
    </group>
  );
}
