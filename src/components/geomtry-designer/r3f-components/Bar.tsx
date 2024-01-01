import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {transQuaternion} from '@gd/IElements';
import {IBar} from '@gd/IElements/IBar';
import {getMatrix3} from '@gd/NamedValues';
import {Line2} from 'three-stdlib';
import NodeSphere from './NodeSphere';
import MeasurablePoint from './MeasurablePointSphere';

const Bar = (props: {element: IBar}) => {
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

  useFrame(() => {
    const selectedPath = store.getState().uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color: string | number = 'pink';
    if (isSelected) {
      color = 0xffa500;
    }
    meshRef.current.material.color.set(color);
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
  const pts = nodes.map((p) => p.value.applyMatrix3(coMatrix));
  const groupRef = React.useRef<THREE.Group>(null!);
  const meshRef = React.useRef<Line2>(null!);

  return (
    <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
      <Line points={pts} color="pink" lineWidth={4} ref={meshRef} />
      {nodes.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
      {measurablePoints.map((p) => (
        <MeasurablePoint node={p} key={p.nodeID} />
      ))}
    </group>
  );
};
export default Bar;
