import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Sphere, Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {trans, isElement} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {INamedVector3} from '@gd/INamedValues';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {Paper, Typography} from '@mui/material';

const NodeSphere = (props: {node: INamedVector3}) => {
  const {node} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = React.useRef<THREE.Mesh>(null);

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      dispatch(setSelectedPoint({point: node}));
      dispatch(selectElement({absPath: node.parent?.absPath ?? ''}));
    },
    [node.absPath]
  );

  const [show, setShow] = React.useState(false);

  useFrame(() => {
    const pwcs = store.getState().uitgd.gdSceneState.selectedPoint ?? [];
    const isSelected = pwcs.find((pwc) => pwc.point.nodeID === node.nodeID);
    let color = 0x00ff00;
    if (isSelected) {
      color = isSelected.color ?? 0xff0000;
    }
    if (materialRef.current) {
      materialRef.current.color.set(color);
    }
    if (isElement(node.parent) && meshRef.current) {
      meshRef.current.visible = node.parent.visible.value ?? false;
    }
  });

  return (
    <Sphere
      ref={meshRef}
      position={trans(node, coMatrix)}
      args={[5, 16, 16]}
      onDoubleClick={(e) => {
        handleOnDoubleClick(e);
      }}
      onPointerEnter={() => setShow(true)} // see note 1
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
export default NodeSphere;
