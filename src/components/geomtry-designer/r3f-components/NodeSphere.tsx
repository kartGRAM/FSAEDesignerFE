import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Sphere} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {INamedVector3} from '@gd/INamedValues';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';

const NodeSphere = (props: {node: INamedVector3}) => {
  const {node} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  const ref = React.useRef<THREE.MeshBasicMaterial>(null!);

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      dispatch(setSelectedPoint({point: node}));
      dispatch(selectElement({absPath: node.parent?.absPath ?? ''}));
    },
    [node.absPath]
  );

  useFrame(() => {
    const pwcs = store.getState().uitgd.gdSceneState.selectedPoint ?? [];
    const isSelected = pwcs.find((pwc) => pwc.point.nodeID === node.nodeID);
    let color = 0x00ff00;
    if (isSelected) {
      color = isSelected.color ?? 0xff0000;
    }
    if (ref.current) {
      ref.current.color.set(color);
    }
  });

  return (
    <Sphere
      position={trans(node, coMatrix)}
      args={[5, 16, 16]}
      onDoubleClick={(e) => {
        handleOnDoubleClick(e);
      }}
    >
      <meshBasicMaterial color={0x00ff00} ref={ref} />
    </Sphere>
  );
};
export default NodeSphere;
