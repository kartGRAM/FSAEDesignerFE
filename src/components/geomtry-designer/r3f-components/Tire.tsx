import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Cylinder, Circle} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {transQuaternion} from '@gd/IElements';
import {ITire} from '@gd/IElements/ITire';
import {getMatrix3} from '@gd/NamedValues';
import NodeSphere from './NodeSphere';
import ForceArrow from './ForceArrow';
import MeasurablePoint from './MeasurablePointSphere';

const Tire = (props: {element: ITire}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!tireRef.current.visible) return;
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

  let time = 0;
  useFrame((_, delta) => {
    let color: string | number = '';
    if (isSelected) {
      color = 0xffa500;
      materialRef.current.color.set(color);
    }
    tireRef.current.visible = element.visible.value ?? false;
    markerRef.current.visible = element.angularVelocity !== 0;

    groupRef.current.position.copy(
      element.position.value.applyMatrix3(coMatrix)
    );
    groupRef.current.quaternion.copy(
      transQuaternion(element.rotation.value, coMatrix)
    );

    time += delta;
    const q = transQuaternion(
      new THREE.Quaternion().setFromAxisAngle(
        element.tireAxis.value.normalize(),
        (time * element.angularVelocity) % (2 * Math.PI)
      ),
      coMatrix
    );
    tireRef.current.quaternion.copy(q.multiply(rotationQ));
  });

  const nodes = element.getPoints();
  const measurablePoints = element.getMeasurablePoints();
  const center = element.tireCenter.value.applyMatrix3(coMatrix);
  const radius = center.y;
  const tread = element.tread.value;
  const groupRef = React.useRef<THREE.Group>(null!);
  const tireRef = React.useRef<THREE.Group>(null!);
  const markerRef = React.useRef<THREE.Mesh>(null!);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null!);
  const rotationQ = transQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      element.tireAxis.value.clone().normalize()
    ),
    coMatrix
  );

  return (
    <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
      <group quaternion={rotationQ} ref={tireRef} position={center}>
        <Cylinder
          args={[radius, radius, tread, 48]}
          rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
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
        </Cylinder>
        <Circle
          ref={markerRef}
          args={[radius * 0.05, 24]}
          position={new THREE.Vector3().setY(-center.y * 0.95).setZ(tread / 2)}
        >
          <meshBasicMaterial color="red" side={THREE.DoubleSide} />
        </Circle>
      </group>
      {nodes.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
      {measurablePoints.map((p) => (
        <MeasurablePoint node={p} key={`${p.nodeID}m`} />
      ))}
      {element.getForceResults().map((res, i) => (
        <ForceArrow element={element} index={i} key={res.nodeID} />
      ))}
    </group>
  );
};
export default Tire;
