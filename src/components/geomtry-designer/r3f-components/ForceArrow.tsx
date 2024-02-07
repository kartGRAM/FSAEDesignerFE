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

const ForceArrow = (props: {element: IElement; index: number}) => {
  const {element, index} = props;
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
        args={[5, 15]}
        position={new THREE.Vector3(0, 0, 45).applyMatrix3(coMatrix)}
      />
      <Cylinder
        ref={cylinderMeshRef}
        args={[2, 2, 40]}
        position={new THREE.Vector3(0, 0, 20).applyMatrix3(coMatrix)}
      />
    </group>
  );
};
export default ForceArrow;
