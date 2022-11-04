import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {ISpringDumper, transQuaternion} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {Line2} from 'three-stdlib';
import NodeSphere from './NodeSphere';

const SpringDumper = (props: {element: ISpringDumper}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      dispatch(selectElement({absPath: element.absPath}));
    },
    [element.absPath]
  );
  const assembled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.assembled
  );

  useFrame(() => {
    const selectedPath = store.getState().uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color: string | number = 'blue';
    meshRef.current.visible = element.visible.value ?? false;

    // ばねの長さをupdate
    const fp = element.fixedPoint.value.applyMatrix3(coMatrix);
    const p = element.point.value.applyMatrix3(coMatrix);
    if (assembled) {
      p.sub(fp)
        .normalize()
        .multiplyScalar(element.length + element.currentDL)
        .add(fp);
      // 限界なら色を変える
      if (
        Math.abs(element.currentDL - element.dlMin.value) < 1e-5 ||
        Math.abs(element.currentDL - element.dlMax.value) < 1e-5
      ) {
        color = 'yellow';
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const start = meshRef.current.geometry.attributes.instanceStart
      .array as Float32Array;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    start[3 + 0] = p.x;
    start[3 + 1] = p.y;
    start[3 + 2] = p.z;
    meshRef.current.geometry.attributes.instanceStart.needsUpdate = true;
    if (isSelected) {
      color = 0xffa500;
    }
    meshRef.current.material.color.set(color);
    // 位置と姿勢を更新
    groupRef.current.position.copy(
      element.position.value.applyMatrix3(coMatrix)
    );
    groupRef.current.quaternion.copy(
      transQuaternion(element.rotation.value, coMatrix)
    );
  });

  const nodes = element.getPoints();
  const pts = nodes.map((p) => p.value.applyMatrix3(coMatrix));
  const groupRef = React.useRef<THREE.Group>(null!);
  const meshRef = React.useRef<Line2>(null!);

  return (
    <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
      <Line points={pts} color="pink" lineWidth={4} ref={meshRef} />
      {nodes.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
    </group>
  );
};
export default SpringDumper;
