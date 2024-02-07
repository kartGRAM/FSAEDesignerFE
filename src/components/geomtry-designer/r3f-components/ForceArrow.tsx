/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {IElement, transQuaternion} from '@gd/IElements';
import {Cone, Cylinder, Html} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {getMatrix3} from '@gd/NamedValues';
import {INamedVector3RO} from '@gd/INamedValues';
import {
  setSelectedPoint,
  setOrbitControlsEnabled
} from '@store/reducers/uiTempGeometryDesigner';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {Paper, Typography} from '@mui/material';
import {range} from '@utils/helpers';

const ForceArrow = (props: {
  element: IElement;
  index: number;
  stdLength?: number;
}) => {
  const {element, index} = props;
  // eslint-disable-next-line react/destructuring-assignment
  const stdLength = props.stdLength ?? 450;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );
  const invCoMatrix = coMatrix.clone().transpose();
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const dispatch = useDispatch();

  useFrame(() => {
    if (!isSkidpadSolver(solver)) return;
    const std = solver.stdForce;
    const force = element.getForceResults()[index];
    const magnitude = force.force.length();
    const size = (stdLength * magnitude) / solver.stdForce;

    const cone = coneMeshRef.current;
    const cylinderGeometry = cylinderMeshRef.current.geometry;
    // cylinderGeometry.attributes.position.needsUpdate = true;
    const cylinderVtx = cylinderGeometry.attributes.position.array;
    cylinderVtx.forEach((p, i) => {
      if (i % 3 !== 1) return;
      if (p > 0) cylinderVtx[i] = size;
      else cylinderVtx[i] = 0;
    });
    cone.position.copy(
      new THREE.Vector3(0, 0, size + 10).applyMatrix3(coMatrix)
    );

    // 位置の反映
    groupRef.current.position.copy(force.point.clone().applyMatrix3(coMatrix));
    const nf = force.force.clone().normalize();
    const dq = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      nf
    );
    const q = element.rotation.value.invert().multiply(dq);
    groupRef.current.quaternion.copy(transQuaternion(q, coMatrix));
  });

  const groupRef = React.useRef<THREE.Group>(null!);
  const coneMeshRef = React.useRef<THREE.Mesh>(null!);
  const cylinderMeshRef = React.useRef<THREE.Mesh>(null!);
  if (!isSkidpadSolver(solver)) return null;

  return (
    <group ref={groupRef}>
      <Cone
        ref={coneMeshRef}
        args={[5, 20]}
        position={new THREE.Vector3(0, 0, stdLength + 10).applyMatrix3(
          coMatrix
        )}
      />
      <Cylinder ref={cylinderMeshRef} args={[2, 2, stdLength]} />
    </group>
  );
};
export default ForceArrow;
