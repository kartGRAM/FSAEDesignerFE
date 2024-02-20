/* eslint-disable prettier/prettier */
import * as React from 'react';
import {useFrame} from '@react-three/fiber';
import {Line2} from 'three-stdlib';
import {useSelector} from 'react-redux';
import {Line} from '@react-three/drei';
import {RootState} from '@store/store';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {getMatrix3} from '@gd/NamedValues';
import {Vector3, Matrix3, Quaternion} from 'three';
import * as THREE from 'three';
import {range} from '@utils/helpers';
import {Cone} from '@gdComponents/r3f-components/3DModels/Cone';

const length = 5000;
const segmentLength = 200;
const GroundPlane = () => {
  const grid = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showGroundPlaneGrid
  );
  const segments = Math.floor(length / segmentLength);

  if (!grid) return null;
  return (
    <>
      <gridHelper args={[length, segments, 0x999999, 0x999999]} />
      <SkidpadRingCenter />
      <SkidpadRingInner />
      <Cone />
    </>
  );
};
export default GroundPlane;


const SkidpadRingCenter = () => {
  const dashSize = 1500;
  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const centerLineRef = React.useRef<Line2>(null);
  let rotation = 0;
  useFrame((_, delta) => {
    if (!centerLineRef.current || !solver || !isSkidpadSolver(solver)) return;

    // センターライン
    const g = centerLineRef.current.geometry.attributes;
    const radius = Math.max(-8000, Math.min(solver.r, 8000));
    const center = new Vector3(0, radius * 1000, 0).applyMatrix3(coMatrix);
    const pts = flatten(getVertices(radius, coMatrix));
    const instanceStart = g.instanceStart.array as Float32Array;
    instanceStart.set(pts, 0);
    g.instanceStart.needsUpdate = true;
    // 間隔
    const distance = getDistance(radius);
    const distanceStart = g.instanceDistanceStart.array as Float32Array;
    distanceStart.set(distance, 0);
    g.instanceDistanceStart.needsUpdate = true;

    // 回転
    const omega = -solver.v / radius;
    rotation += delta * omega;
    const rot = new Quaternion().setFromAxisAngle(
      new Vector3(0, 0, 1).applyMatrix3(coMatrix),
      rotation
    );
    centerLineRef.current.quaternion.copy(rot);

    centerLineRef.current.position.copy(center);
  });

  const clipPlanes = [
    new THREE.Plane(
      new THREE.Vector3(1, 0, 0).applyMatrix3(coMatrix),
      length / 2
    ),
    new THREE.Plane(
      new THREE.Vector3(-1, 0, 0).applyMatrix3(coMatrix),
      length / 2
    ),
    new THREE.Plane(
      new THREE.Vector3(0, -1, 0).applyMatrix3(coMatrix),
      length / 2
    ),
    new THREE.Plane(
      new THREE.Vector3(0, 1, 0).applyMatrix3(coMatrix),
      length / 2
    )
  ];

  if (!solver || !isSkidpadSolver(solver)) return null;
  const radius = Math.max(-8000, Math.min(solver.r, 8000));
  const center = new Vector3(0, radius * 1000, 0).applyMatrix3(coMatrix);
  const vtx = getVertices(radius, coMatrix);
  return (
    <Line
      ref={centerLineRef}
      points={vtx} // Array of Points
      lineWidth={2}
      color="#ddd"
      position={center}
      dashed
      dashSize={dashSize}
      gapSize={dashSize}
      clippingPlanes={clipPlanes}
    />
  );
};

const SkidpadRingInner = () => {
  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const centerLineRef = React.useRef<Line2>(null);
  useFrame(() => {
    if (!centerLineRef.current || !solver || !isSkidpadSolver(solver)) return;

    // センターライン
    const g = centerLineRef.current.geometry.attributes;
    const offset = Math.abs(solver.rMin - solver.r);
    const radius = Math.max(
      -8000 - offset,
      Math.min(solver.rMin, 8000 + offset)
    );
    const pts = flatten(getVertices(radius, coMatrix));
    const instanceStart = g.instanceStart.array as Float32Array;
    instanceStart.set(pts, 0);
    g.instanceStart.needsUpdate = true;
    // 間隔
    const distance = getDistance(radius);
    const distanceStart = g.instanceDistanceStart.array as Float32Array;
    distanceStart.set(distance, 0);
    g.instanceDistanceStart.needsUpdate = true;

    const radiusC = Math.max(-8000, Math.min(solver.r, 8000));
    const center = new Vector3(0, radiusC * 1000, 0).applyMatrix3(coMatrix);
    centerLineRef.current.position.copy(center);
  });

  const clipPlanes = [
    new THREE.Plane(
      new THREE.Vector3(1, 0, 0).applyMatrix3(coMatrix),
      length / 2
    ),
    new THREE.Plane(
      new THREE.Vector3(-1, 0, 0).applyMatrix3(coMatrix),
      length / 2
    ),
    new THREE.Plane(
      new THREE.Vector3(0, -1, 0).applyMatrix3(coMatrix),
      length / 2
    ),
    new THREE.Plane(
      new THREE.Vector3(0, 1, 0).applyMatrix3(coMatrix),
      length / 2
    )
  ];

  if (!solver || !isSkidpadSolver(solver)) return null;
  const radius = Math.max(-8000, Math.min(solver.rMin, 8000));
  const radiusC = Math.max(-8000, Math.min(solver.r, 8000));
  const center = new Vector3(0, radiusC * 1000, 0).applyMatrix3(coMatrix);
  const vtx = getVertices(radius, coMatrix);
  return (
    <Line
      ref={centerLineRef}
      points={vtx} // Array of Points
      lineWidth={2}
      color="hotpink"
      position={center}
      clippingPlanes={clipPlanes}
    />
  );
};

const segments = 4096;
const getVertices = (radius: number, coMatrix: Matrix3) => {
  const vertices: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * radius * 1000;
    const y = Math.sin(theta) * radius * 1000;
    const v = new Vector3(x, y, 0);
    v.applyMatrix3(coMatrix);
    vertices.push(v);
  }
  return vertices;
};

const flatten = (v: Vector3[]) => {
  const pts = v.map((v) => [v.x, v.y, v.z, v.x, v.y, v.z]).flat();
  return pts.slice(3, pts.length - 3);
};

const getDistance = (radius: number) => {
  const delta = (Math.PI * 2) / segments;
  const x = Math.sin(delta);
  const y = 1 - Math.cos(delta);
  const distance = Math.sqrt(x * x + y * y) * Math.abs(radius) * 1000;
  const distances = range(0, segments + 1)
    .map((i) => {
      const c = distance * i;
      return [c, c];
    })
    .flat();
  return distances.slice(1, distances.length - 1);
};
