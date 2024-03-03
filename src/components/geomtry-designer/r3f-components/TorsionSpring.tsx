/* eslint-disable @typescript-eslint/no-unused-vars */
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
import {OBB} from './OBB';

const TorsionSpring = (props: {element: ITorsionSpring}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  useSelector((state: RootState) => state.dgd.present.lastGlobalFormulaUpdate);

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
    const measurablePoints = element.getMeasurablePoints();
    const selectedPath = store.getState().uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color: string | number = 'lavender';

    const pts = measurablePoints.map((p) => p.value.applyMatrix3(coMatrix));

    meshRefs.forEach((meshRef, i) => {
      if (!meshRef.current) return;
      meshRef.current.visible = element.visible.value ?? false;
      meshRef.current.geometry.attributes.instanceStart.needsUpdate = true;
      if (isSelected) {
        color = 0xffa500;
      }
      meshRef.current.material.color.set(color);

      if (i !== 1) return;
      const start = meshRef.current.geometry.attributes.instanceStart
        .array as Float32Array;
      const p = pts[2];
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

    const p = pts[2].clone().sub(points[2].value.applyMatrix3(coMatrix));
    dlRef.current.position.copy(p);
  });

  const points = element.getPoints();
  const groupRef = React.useRef<THREE.Group>(null!);
  const dlRef = React.useRef<THREE.Group>(null!);
  const meshRefs = [
    React.useRef<Line2>(null!),
    React.useRef<Line2>(null!),
    React.useRef<Line2>(null!)
  ];

  const pts = points.map((p) => p.value.applyMatrix3(coMatrix));
  const axis = pts[1].clone().sub(pts[0]);
  const lenAxis = axis.length();
  axis.normalize();
  const currentPoints = pts.slice(2, 2 + element.effortPoints.length);
  const t = currentPoints.map((c) => axis.dot(c.clone().sub(pts[0])));
  const axisPoints = t.map((t) => axis.clone().multiplyScalar(t).add(pts[0]));
  const axisLine = [...pts.slice(0, 2)];
  let maxT = lenAxis;
  let minT = 0;
  t.forEach((t) => {
    if (t > maxT) {
      axisLine[1] = axis.clone().multiplyScalar(t).add(pts[0]);
      maxT = t;
    }
    if (t < minT) {
      axisLine[0] = axis.clone().multiplyScalar(t).add(pts[0]);
      minT = t;
    }
  });
  const measurablePointsInit = element.getMeasurablePoints();

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
      <OBB obb={element.obb} />
      {points.map((node, i) =>
        i !== 2 ? <NodeSphere node={node} key={node.nodeID} /> : null
      )}
      {measurablePointsInit.map((p, i) =>
        i !== 2 ? <MeasurablePoint node={p} key={`${p.nodeID}m`} /> : null
      )}
      <group ref={dlRef}>
        <NodeSphere node={points[2]} key={points[2].nodeID} />
        <MeasurablePoint
          node={points[2]}
          key={`${measurablePointsInit[2].nodeID}m`}
        />
      </group>
    </group>
  );
};
export default TorsionSpring;
