import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Sphere, Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {isElement} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {INamedVector3RO} from '@gd/INamedValues';
import {
  setSelectedPoint,
  setOrbitControlsEnabled
} from '@store/reducers/uiTempGeometryDesigner';

import {Paper, Typography} from '@mui/material';
import {PivotControls} from './PivotControls/PivotControls';

const NodeSphere = (props: {
  node: INamedVector3RO;
  applyPosition?: boolean;
}) => {
  const {node, applyPosition} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  const invCoMatrix = coMatrix.clone().transpose();
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = React.useRef<THREE.Mesh>(null!);
  const pivotControlsRef = React.useRef<THREE.Group>(null!);
  const deltaVRef = React.useRef<THREE.Vector3>(new THREE.Vector3());

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!meshRef.current.visible) return;
      e.stopPropagation();
      dispatch(setSelectedPoint({point: node}));
      dispatch(selectElement({absPath: node.parent?.absPath ?? ''}));
    },
    [dispatch, node]
  );

  const [show, setShow] = React.useState(false);

  const isMoveTarget = useSelector(
    (state: RootState) =>
      state.uitgd.gdDialogState.movePointDialogProps.target?.nodeID ===
      node.nodeID
  );

  useFrame(() => {
    const pwcs = store.getState().uitgd.gdSceneState.selectedPoint ?? [];
    const isSelected = pwcs.find((pwc) => pwc.point.nodeID === node.nodeID);
    let color = 0x00ff00;
    if (isSelected) {
      color = isSelected.color ?? 0xff0000;
      meshRef.current.scale.set(1.1, 1.1, 1.1);
    } else {
      meshRef.current.scale.set(1.0, 1.0, 1.0);
    }
    if (materialRef.current) {
      materialRef.current.color.set(color);
    }
    if (isElement(node.parent)) {
      meshRef.current.visible = node.parent.visible.value ?? false;
      if (!isSelected) {
        const visualizationMode =
          store.getState().uigd.present.gdSceneState.componentVisualizationMode;
        meshRef.current.visible =
          visualizationMode === 'ShowAllNodes' && !!node.parent.visible.value;
      }
    }
  });

  const position = node.value.applyMatrix3(coMatrix);
  if (applyPosition && isElement(node.parent)) {
    position.add(node.parent.position.value.applyMatrix3(coMatrix));
  }

  const sphere = (
    <Sphere
      ref={meshRef}
      args={[5, 16, 16]}
      onDoubleClick={(e) => {
        handleOnDoubleClick(e);
      }}
      onPointerEnter={() => {
        if (meshRef.current?.visible) setShow(true);
      }}
      onPointerLeave={() => setShow(false)} // see note 1
      onClick={() => {
        const onSelected =
          store.getState().uitgd.gdDialogState.copyFromExistingPointsOnSelected;
        if (onSelected) {
          const v = node.value;
          if (isElement(node.parent)) {
            v.add(node.parent.position.value);
          }
          onSelected(v);
        }
      }} // see note 1
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
              &nbsp;{node.name}
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
              @{isElement(node.parent) && node.parent.name.value}
            </Typography>
          </Paper>
        </Html>
      ) : null}
    </Sphere>
  );

  return (
    <group position={position}>
      {isMoveTarget ? (
        <PivotControls
          ref={pivotControlsRef}
          depthTest={false}
          scale={70}
          onDragStart={() => {
            dispatch(setOrbitControlsEnabled(false));
          }}
          onDragEnd={() => {
            dispatch(setOrbitControlsEnabled(true));
            deltaVRef.current
              .set(0, 0, 0)
              .applyMatrix4(pivotControlsRef.current.matrix)
              .applyMatrix3(invCoMatrix);
            const onMoved =
              store.getState().uitgd.gdDialogState.movePointOnMoved;
            if (onMoved) onMoved(deltaVRef.current);
          }}
        >
          {sphere}
        </PivotControls>
      ) : (
        sphere
      )}
    </group>
  );
};
export default NodeSphere;
