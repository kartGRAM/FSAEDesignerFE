import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {ILinearBushing, transQuaternion} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {Line2} from 'three-stdlib';
import NodeSphere from './NodeSphere';

const LinearBushing = (props: {element: ILinearBushing}) => {
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

  useFrame(() => {
    const selectedPath = store.getState().uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color: string | number = 'blue';
    meshRef.current.visible = element.visible.value ?? false;

    // 限界なら色を変える
    if (element.isLimited) {
      color = 'yellow';
    }

    const start = meshRef.current.geometry.attributes.instanceStart
      .array as Float32Array;
    const {supportDistance} = element;

    const toPoints = element.toPoints.map((p) => p.value + element.dlCurrent);
    const fp = element.fixedPoints.map((p) => p.value);
    const center = fp[0].clone().add(fp[1]).multiplyScalar(0.5);
    const dir = fp[1].clone().sub(fp[0]).normalize();

    const ptsTo = [
      Math.min(-supportDistance / 2, ...toPoints),
      Math.max(supportDistance / 2, ...toPoints)
    ];
    ptsTo.forEach((to, i) => {
      const p = center
        .clone()
        .add(dir.clone().multiplyScalar(to))
        .applyMatrix3(coMatrix);
      start[i * 3 + 0] = p.x;
      start[i * 3 + 1] = p.y;
      start[i * 3 + 2] = p.z;
    });
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

  const nodes = element.fixedPoints;
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
export default LinearBushing;