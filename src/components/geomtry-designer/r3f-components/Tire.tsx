import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Circle} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {ITire, transQuaternion} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import NodeSphere from './NodeSphere';
import MeasurablePoint from './MeasurablePointSphere';

const Tire = (props: {element: ITire}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!meshRef.current.visible) return;
      if (store.getState().uitgd.uiDisabled) return;
      e.stopPropagation();
      dispatch(selectElement({absPath: element.absPath}));
    },
    [dispatch, element.absPath]
  );

  const isSelected = useSelector((state: RootState) => {
    const selectedPath = state.uitgd.selectedElementAbsPath;
    return !!selectedPath && element.absPath.includes(selectedPath);
  });

  useFrame(() => {
    let color: string | number = '';
    if (isSelected) {
      color = 0xffa500;
      materialRef.current.color.set(color);
    }
    meshRef.current.visible = element.visible.value ?? false;

    groupRef.current.position.copy(
      element.position.value.applyMatrix3(coMatrix)
    );
    groupRef.current.quaternion.copy(
      transQuaternion(element.rotation.value, coMatrix)
    );
  });

  const nodes = element.getPoints();
  const measurablePoints = element.getMeasurablePoints();
  const center = element.tireCenter.value.applyMatrix3(coMatrix);
  const radius = center.y;
  const groupRef = React.useRef<THREE.Group>(null!);
  const meshRef = React.useRef<THREE.Mesh>(null!);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null!);

  return (
    <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
      <Circle
        args={[radius, 64]}
        position={center}
        ref={meshRef}
        rotation={new THREE.Euler(0, Math.PI / 2, 0, 'XYZ')}
      >
        {isSelected ? (
          <meshBasicMaterial
            wireframe
            wireframeLinewidth={3}
            ref={materialRef}
          />
        ) : (
          <meshNormalMaterial wireframe wireframeLinewidth={3} />
        )}
      </Circle>
      {nodes.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
      {measurablePoints.map((p) => (
        <MeasurablePoint node={p} key={p.nodeID} />
      ))}
    </group>
  );
};
export default Tire;
