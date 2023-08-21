import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Sphere, Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {isElement} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {INamedVector3RO} from '@gd/INamedValues';
import {setMeasureElementPointSelected} from '@store/reducers/uiTempGeometryDesigner';
import {Paper, Typography} from '@mui/material';

const MeasurablePointSphere = (props: {node: INamedVector3RO}) => {
  const {node} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  const mode = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.measureElementPointsMode
  );
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = React.useRef<THREE.Mesh>(null);

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!meshRef.current?.visible) return;
      e.stopPropagation();
      dispatch(setMeasureElementPointSelected(node.nodeID));
    },
    [dispatch, node.nodeID]
  );

  const [show, setShow] = React.useState(false);

  useFrame(() => {
    const isSelected =
      store.getState().uitgd.gdSceneState.measureElementPointSelected ===
      node.nodeID;
    let color = 0x00ff00;
    if (isSelected) {
      color = 0xff0000;
      meshRef.current?.scale.set(1.1, 1.1, 1.1);
    } else {
      meshRef.current?.scale.set(1.0, 1.0, 1.0);
    }
    if (materialRef.current) {
      materialRef.current.color.set(color);
    }
    if (isElement(node.parent) && meshRef.current) {
      meshRef.current.visible = node.parent.visible.value ?? false;
    }
  });

  if (!mode) return null;

  const position = node.value.applyMatrix3(coMatrix);

  return (
    <Sphere
      ref={meshRef}
      position={position}
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
};
export default MeasurablePointSphere;
