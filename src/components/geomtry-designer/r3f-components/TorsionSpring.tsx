import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {transQuaternion} from '@gd/IElements';
import {ITorsionSpring} from '@gd/IElements/ITorsionSpring';
import {getMatrix3} from '@gd/NamedValues';
import {Line2} from 'three-stdlib';
import NodeSphere from './NodeSphere';
import MeasurablePoint from './MeasurablePointSphere';

const TorsionSpring = (props: {element: ITorsionSpring}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!meshRefs[0].current.visible) return;
      if (store.getState().uitgd.uiDisabled) return;
      e.stopPropagation();
      dispatch(selectElement({absPath: element.absPath}));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, element.absPath]
  );

  useFrame(() => {
    const selectedPath = store.getState().uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color: string | number = 'blue';

    const nodes = element
      .getPoints()
      .map((p) => p.value.applyMatrix3(coMatrix));
    const pts = measurablePoints.map((p) => p.value.applyMatrix3(coMatrix));
    const axis = pts[1].clone().sub(pts[1]).normalize();
    const currentPoints = pts.slice(2, 4);

    meshRefs.forEach((meshRef, i) => {
      meshRef.current.visible = element.visible.value ?? false;
      meshRef.current.geometry.attributes.instanceStart.needsUpdate = true;
      if (isSelected) {
        color = 0xffa500;
      }
      meshRef.current.material.color.set(color);
      if (i !== 1) return;
      const start = meshRef.current.geometry.attributes.instanceStart
        .array as Float32Array;
      const p = currentPoints[0].clone().applyMatrix3(coMatrix);
      start[0] = p.x;
      start[1] = p.y;
      start[2] = p.z;
    });

    // 位置と姿勢を更新
    groupRef.current.position.copy(
      element.position.value.applyMatrix3(coMatrix)
    );
    groupRef.current.quaternion.copy(
      transQuaternion(element.rotation.value, coMatrix)
    );

    const a = (element.dlCurrent * Math.PI) / 180;
    const q = new THREE.Quaternion().setFromAxisAngle(axis, a);
    const p = nodes[2]
      .clone()
      .sub(nodes[0])
      .applyQuaternion(q)
      .add(nodes[0])
      .sub(nodes[2]);

    dlRef.current.position.copy(p);
  });

  const nodes = element.getPoints();
  const measurablePoints = element.getMeasurablePoints();
  const fixedPoints = nodes.slice(0, 2);
  const points = nodes.slice(2);
  const groupRef = React.useRef<THREE.Group>(null!);
  const dlRef = React.useRef<THREE.Group>(null!);
  const meshRefs = [
    React.useRef<Line2>(null!),
    React.useRef<Line2>(null!),
    React.useRef<Line2>(null!)
  ];

  const pts = measurablePoints.map((p) => p.value.applyMatrix3(coMatrix));
  const axis = pts[1].clone().sub(pts[0]).normalize();
  const currentPoints = pts.slice(2, 4);
  const t = currentPoints.map((c) => axis.dot(c));
  const axisPoints = t.map((t) => axis.clone().multiplyScalar(t));
  const axisLine = [...pts.slice(0, 2)];
  let maxT = 1;
  let minT = 1;
  t.forEach((t) => {
    if (t > maxT) {
      axisLine[1] = axis.clone().multiplyScalar(t);
      maxT = t;
    }
    if (t < minT) {
      axisLine[0] = axis.clone().multiplyScalar(t);
      minT = t;
    }
  });

  return (
    <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
      <Line points={axisLine} color="pink" lineWidth={4} ref={meshRefs[0]} />
      <Line
        points={[currentPoints[0], axisPoints[0]]}
        color="pink"
        lineWidth={4}
        ref={meshRefs[1]}
      />
      {currentPoints[1] ? (
        <Line
          points={[currentPoints[1], axisPoints[1]]}
          color="pink"
          lineWidth={4}
          ref={meshRefs[2]}
        />
      ) : null}
      {fixedPoints.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
      {points.map((node, i) =>
        i !== 0 ? <NodeSphere node={node} key={node.nodeID} /> : null
      )}
      {measurablePoints.map((p, i) =>
        i !== 2 ? <MeasurablePoint node={p} key={p.nodeID} /> : null
      )}
      <group ref={dlRef}>
        <NodeSphere node={points[0]} key={points[0].nodeID} />
        <MeasurablePoint
          node={measurablePoints[2]}
          key={measurablePoints[2].nodeID}
        />
      </group>
    </group>
  );
};
export default TorsionSpring;
